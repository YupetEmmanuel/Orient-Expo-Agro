import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertListingSchema,
  insertCropInfoSchema,
  insertQuestionSchema,
  insertAnswerSchema,
  type Listing,
} from "@shared/schema";
import { ObjectStorageService, objectStorageClient } from "./objectStorage";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";

// Helper function to remove password from listing
function sanitizeListing(listing: Listing): Omit<Listing, 'password'> {
  const { password, ...sanitized } = listing;
  return sanitized;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Listing routes
  app.get("/api/listings", async (req, res) => {
    try {
      const { role, cropType, search } = req.query;
      const listings = await storage.getListings({
        role: role as string,
        cropType: cropType as string,
        search: search as string,
      });
      // Remove passwords from response
      const sanitizedListings = listings.map(sanitizeListing);
      res.json(sanitizedListings);
    } catch (error) {
      console.error("Error fetching listings:", error);
      res.status(500).json({ message: "Failed to fetch listings" });
    }
  });

  app.get("/api/listings/:id", async (req, res) => {
    try {
      const listing = await storage.getListing(req.params.id);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      // Remove password from response
      res.json(sanitizeListing(listing));
    } catch (error) {
      console.error("Error fetching listing:", error);
      res.status(500).json({ message: "Failed to fetch listing" });
    }
  });

  app.post("/api/listings", async (req, res) => {
    try {
      const validated = insertListingSchema.parse(req.body);
      // Hash password before storing
      const hashedPassword = await bcrypt.hash(validated.password, 10);
      const listing = await storage.createListing({
        ...validated,
        password: hashedPassword,
      });
      // Remove password from response
      res.json(sanitizeListing(listing));
    } catch (error: any) {
      console.error("Error creating listing:", error);
      // If it's a Zod validation error, return the specific error
      if (error.name === 'ZodError') {
        const firstError = error.errors[0];
        return res.status(400).json({ 
          message: `${firstError.path.join('.')}: ${firstError.message}` 
        });
      }
      res.status(400).json({ message: error.message || "Failed to create listing" });
    }
  });

  app.patch("/api/listings/:id", async (req, res) => {
    try {
      const validated = insertListingSchema.partial().parse(req.body);
      // If password is being updated, hash it
      if (validated.password) {
        validated.password = await bcrypt.hash(validated.password, 10);
      }
      const listing = await storage.updateListing(req.params.id, validated);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      // Remove password from response
      res.json(sanitizeListing(listing));
    } catch (error) {
      console.error("Error updating listing:", error);
      res.status(400).json({ message: "Failed to update listing" });
    }
  });

  app.delete("/api/listings/:id", async (req, res) => {
    try {
      const { vendorName, password } = req.body;
      
      if (!vendorName || !password) {
        return res.status(400).json({ message: "Vendor name and password are required" });
      }
      
      // Get the listing first to verify credentials
      const listing = await storage.getListing(req.params.id);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      // Verify vendor name and compare hashed password
      const passwordMatch = await bcrypt.compare(password, listing.password);
      if (listing.vendorName !== vendorName || !passwordMatch) {
        return res.status(403).json({ message: "Invalid vendor name or password" });
      }
      
      await storage.deleteListing(req.params.id);
      res.json({ message: "Listing deleted successfully" });
    } catch (error) {
      console.error("Error deleting listing:", error);
      res.status(500).json({ message: "Failed to delete listing" });
    }
  });

  // Image upload route
  app.post("/api/upload-image", async (req, res) => {
    try {
      const objectStorage = new ObjectStorageService();
      const publicPaths = objectStorage.getPublicObjectSearchPaths();
      
      if (publicPaths.length === 0) {
        throw new Error("No public object storage paths configured");
      }
      
      // Get the first public path (e.g., "/bucket-name/public")
      const publicPath = publicPaths[0];
      const uniqueFileName = randomUUID();
      const fullPath = `${publicPath}/listings/${uniqueFileName}.jpg`;
      
      // Parse bucket and object name
      const pathParts = fullPath.split("/").filter(p => p);
      const bucketName = pathParts[0];
      const objectName = pathParts.slice(1).join("/");
      
      // Generate presigned upload URL
      const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";
      const request = {
        bucket_name: bucketName,
        object_name: objectName,
        method: "PUT",
        expires_at: new Date(Date.now() + 900000).toISOString(), // 15 minutes
      };
      
      const response = await fetch(
        `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to sign object URL: ${response.status}`);
      }
      
      const { signed_url: uploadUrl } = await response.json();
      
      // Return a proxied URL that will serve the image through our backend
      // This works around the public access prevention on the GCS bucket
      const publicUrl = `/api/images/${encodeURIComponent(bucketName)}/${encodeURIComponent(objectName)}`;
      
      res.json({
        uploadUrl,
        publicUrl,
        bucketName,
        objectName,
      });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ message: "Failed to generate upload URL" });
    }
  });

  // Serve images from GCS (proxy endpoint)
  app.get("/api/images/:bucketName/:objectPath(*)", async (req, res) => {
    try {
      const { bucketName, objectPath } = req.params;
      
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectPath);
      
      // Check if file exists
      const [exists] = await file.exists();
      if (!exists) {
        return res.status(404).json({ message: "Image not found" });
      }
      
      // Get file metadata
      const [metadata] = await file.getMetadata();
      
      // Set appropriate headers
      res.set({
        "Content-Type": metadata.contentType || "image/jpeg",
        "Content-Length": metadata.size,
        "Cache-Control": "public, max-age=31536000", // Cache for 1 year
      });
      
      // Stream the file to the response
      const stream = file.createReadStream();
      
      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });
      
      stream.pipe(res);
    } catch (error) {
      console.error("Error serving image:", error);
      if (!res.headersSent) {
        res.status(500).json({ message: "Failed to serve image" });
      }
    }
  });

  // Crop Info routes
  app.get("/api/crop-info", async (req, res) => {
    try {
      const { search } = req.query;
      const cropInfoList = search
        ? await storage.searchCropInfo(search as string)
        : await storage.getAllCropInfo();
      res.json(cropInfoList);
    } catch (error) {
      console.error("Error fetching crop info:", error);
      res.status(500).json({ message: "Failed to fetch crop info" });
    }
  });

  app.get("/api/crop-info/:id", async (req, res) => {
    try {
      const info = await storage.getCropInfo(req.params.id);
      if (!info) {
        return res.status(404).json({ message: "Crop info not found" });
      }
      res.json(info);
    } catch (error) {
      console.error("Error fetching crop info:", error);
      res.status(500).json({ message: "Failed to fetch crop info" });
    }
  });

  app.post("/api/crop-info", async (req, res) => {
    try {
      const validated = insertCropInfoSchema.parse(req.body);
      const info = await storage.createCropInfo(validated);
      res.json(info);
    } catch (error) {
      console.error("Error creating crop info:", error);
      res.status(400).json({ message: "Failed to create crop info" });
    }
  });

  app.patch("/api/crop-info/:id", async (req, res) => {
    try {
      const validated = insertCropInfoSchema.partial().parse(req.body);
      const info = await storage.updateCropInfo(req.params.id, validated);
      if (!info) {
        return res.status(404).json({ message: "Crop info not found" });
      }
      res.json(info);
    } catch (error) {
      console.error("Error updating crop info:", error);
      res.status(400).json({ message: "Failed to update crop info" });
    }
  });

  app.delete("/api/crop-info/:id", async (req, res) => {
    try {
      await storage.deleteCropInfo(req.params.id);
      res.json({ message: "Crop info deleted successfully" });
    } catch (error) {
      console.error("Error deleting crop info:", error);
      res.status(500).json({ message: "Failed to delete crop info" });
    }
  });

  // Question routes
  app.get("/api/questions", async (req, res) => {
    try {
      const { search } = req.query;
      const questions = search
        ? await storage.searchQuestions(search as string)
        : await storage.getAllQuestions();
      res.json(questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  app.get("/api/questions/:id", async (req, res) => {
    try {
      const question = await storage.getQuestion(req.params.id);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      res.json(question);
    } catch (error) {
      console.error("Error fetching question:", error);
      res.status(500).json({ message: "Failed to fetch question" });
    }
  });

  app.post("/api/questions", async (req, res) => {
    try {
      const validated = insertQuestionSchema.parse(req.body);
      const question = await storage.createQuestion(validated);
      res.json(question);
    } catch (error: any) {
      console.error("Error creating question:", error);
      if (error.name === 'ZodError') {
        const firstError = error.errors[0];
        return res.status(400).json({ 
          message: `${firstError.path.join('.')}: ${firstError.message}` 
        });
      }
      res.status(400).json({ message: error.message || "Failed to create question" });
    }
  });

  app.delete("/api/questions/:id", async (req, res) => {
    try {
      await storage.deleteQuestion(req.params.id);
      res.json({ message: "Question deleted successfully" });
    } catch (error) {
      console.error("Error deleting question:", error);
      res.status(500).json({ message: "Failed to delete question" });
    }
  });

  // Answer routes
  app.get("/api/questions/:questionId/answers", async (req, res) => {
    try {
      const answers = await storage.getAnswersByQuestionId(req.params.questionId);
      res.json(answers);
    } catch (error) {
      console.error("Error fetching answers:", error);
      res.status(500).json({ message: "Failed to fetch answers" });
    }
  });

  app.post("/api/answers", async (req, res) => {
    try {
      const validated = insertAnswerSchema.parse(req.body);
      const answer = await storage.createAnswer(validated);
      res.json(answer);
    } catch (error: any) {
      console.error("Error creating answer:", error);
      if (error.name === 'ZodError') {
        const firstError = error.errors[0];
        return res.status(400).json({ 
          message: `${firstError.path.join('.')}: ${firstError.message}` 
        });
      }
      res.status(400).json({ message: error.message || "Failed to create answer" });
    }
  });

  app.delete("/api/answers/:id", async (req, res) => {
    try {
      await storage.deleteAnswer(req.params.id);
      res.json({ message: "Answer deleted successfully" });
    } catch (error) {
      console.error("Error deleting answer:", error);
      res.status(500).json({ message: "Failed to delete answer" });
    }
  });

  // Seed questions endpoint
  app.post("/api/seed-questions", async (req, res) => {
    try {
      const questionsData = [
        {
          title: "How do I contact a vendor?",
          body: "I found a product I like and want to reach out to the seller. How can I contact them?",
          authorName: "Sarah Johnson",
          answers: [{
            body: "To contact a vendor on Orient, simply view any product listing and scroll down to the \"Contact Vendor\" section. You will find the vendor's phone number and email address displayed there. You can call them directly or send them an email to inquire about the product, discuss pricing, arrange pickup, or ask any questions you have. No account or login is required!",
            authorName: "Orient Support Team",
          }],
        },
        {
          title: "How do I post an item for sale?",
          body: "I am a vendor and want to list my products on Orient. What are the steps to upload an item?",
          authorName: "Farm Owner Mike",
          answers: [{
            body: "Posting an item on Orient is easy! First, go to the home page and click the \"Post Item\" button at the top. You will see a form where you need to fill in: your vendor name, item name, description, price, category (vegetables, fruits, grains, or livestock), contact phone, contact email, and a password. You can also upload a photo of your product. The password is important - you will need it later if you want to delete your listing. Once you fill everything out, click \"Post Listing\" and your item will be live on the marketplace immediately!",
            authorName: "Farmer Joe",
          }],
        },
        {
          title: "How do I browse products on Orient?",
          body: "I am new to Orient and want to see what products are available. How do I navigate the marketplace?",
          authorName: "New User",
          answers: [{
            body: "Browsing products on Orient is simple! When you open the app, you will see the home page with all available products displayed as cards. Each card shows the item name, vendor name, price, and category. You can scroll through all the listings to see what's available. If you want to see more details about a specific product, just tap on the product card and it will take you to the full product page with description, vendor contact information, and more details.",
            authorName: "Happy Customer",
          }],
        },
        {
          title: "Can I filter products by category?",
          body: "I am only interested in certain types of products. Is there a way to filter what I see?",
          authorName: "Busy Shopper",
          answers: [{
            body: "Yes! Orient has a category filter to help you find exactly what you are looking for. At the top of the home page, you will see a dropdown menu labeled \"Filter by Category\". Click on it and you can choose from: All Categories, Vegetables, Fruits, Grains, or Livestock. Select the category you want and the page will instantly show only products from that category. This makes it much easier to find specific types of products without scrolling through everything!",
            authorName: "Tech Helper",
          }],
        },
        {
          title: "Do I need to create an account to use Orient?",
          body: "I want to know if I need to sign up or register to browse and buy products.",
          authorName: "Anonymous User",
          answers: [{
            body: "No, you do not need to create an account to use Orient! The platform is designed to be simple and accessible for everyone. Buyers can browse all products and contact vendors without signing up or logging in. Vendors can post their products without creating an account - they just need to set a password for their listing so they can delete it later if needed. Orient is all about making it easy for farmers and buyers to connect without barriers!",
            authorName: "Orient Team",
          }],
        },
        {
          title: "What is Orient?",
          body: "I just heard about Orient. Can someone explain what this platform is for?",
          authorName: "Curious Visitor",
          answers: [{
            body: "Orient is a mobile-friendly marketplace platform that connects farmers and food vendors with buyers in their community. It is designed specifically for local food producers to showcase their fresh products like vegetables, fruits, grains, and livestock. Buyers can browse available products, see prices, read descriptions, and contact vendors directly. The platform is simple to use - no complicated signup process, no lengthy forms. Just post your products or browse what is available, and connect directly with local producers and customers!",
            authorName: "Platform Admin",
          }],
        },
        {
          title: "How do I edit or delete my listing?",
          body: "I posted an item but need to make changes or remove it. How can I do that?",
          authorName: "Vendor Anna",
          answers: [{
            body: "To delete your listing on Orient, go to the product page for the item you posted. At the bottom of the page, you will see a \"Delete Listing\" button. Click it and you will be asked to enter your vendor name and the password you set when you created the listing. Once you confirm, your listing will be permanently removed. Currently, Orient does not support editing listings - if you need to make changes, you will need to delete the old listing and create a new one with the updated information.",
            authorName: "Vendor Support",
          }],
        },
        {
          title: "Are the products on Orient locally sourced?",
          body: "I prefer to buy local. Can I find farmers and food vendors from my area on Orient?",
          authorName: "Local Food Supporter",
          answers: [{
            body: "Yes! Orient is specifically designed for local farmers and food vendors in your area. All products listed on the platform come from local vendors, farmers, and small food producers in your community. When you view a product, you can see the vendor's contact information and reach out to them directly to learn more about where their products come from, their farming practices, and delivery or pickup options. By using Orient, you are supporting local businesses and your local food economy!",
            authorName: "Local Food Advocate",
          }],
        },
        {
          title: "How do I contact Orient Expo?",
          body: "I have a question or need help with something on Orient. How can I reach out to the Orient team?",
          authorName: "Community Member",
          answers: [{
            body: "You can contact us directly through this Q&A section! Simply click the \"Ask Question\" button and write your question. In the title field, include \"for orient\" so we know it is directed to our team, and we will respond to your question as soon as possible. This is the best way to get help, report issues, or share feedback about the Orient platform.",
            authorName: "Orient Expo Team",
          }],
        },
      ];

      let questionsAdded = 0;
      let answersAdded = 0;

      for (const questionData of questionsData) {
        // Check if question already exists
        const existing = await storage.getAllQuestions();
        const alreadyExists = existing.some(q => q.title === questionData.title);

        if (alreadyExists) {
          continue;
        }

        // Create question
        const newQuestion = await storage.createQuestion({
          title: questionData.title,
          body: questionData.body,
          authorName: questionData.authorName,
        });

        questionsAdded++;

        // Create answers for this question
        for (const answerData of questionData.answers) {
          await storage.createAnswer({
            questionId: newQuestion.id,
            body: answerData.body,
            authorName: answerData.authorName,
          });
          answersAdded++;
        }
      }

      res.json({
        success: true,
        questionsAdded,
        answersAdded,
        message: `Successfully seeded ${questionsAdded} questions and ${answersAdded} answers`,
      });
    } catch (error) {
      console.error("Error seeding questions:", error);
      res.status(500).json({ message: "Failed to seed questions" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
