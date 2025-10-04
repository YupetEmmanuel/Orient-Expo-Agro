import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertListingSchema,
  insertCropInfoSchema,
} from "@shared/schema";
import { ObjectStorageService, objectStorageClient } from "./objectStorage";
import { randomUUID } from "crypto";

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
      res.json(listings);
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
      res.json(listing);
    } catch (error) {
      console.error("Error fetching listing:", error);
      res.status(500).json({ message: "Failed to fetch listing" });
    }
  });

  app.post("/api/listings", async (req, res) => {
    try {
      const validated = insertListingSchema.parse(req.body);
      const listing = await storage.createListing(validated);
      res.json(listing);
    } catch (error) {
      console.error("Error creating listing:", error);
      res.status(400).json({ message: "Failed to create listing" });
    }
  });

  app.patch("/api/listings/:id", async (req, res) => {
    try {
      const validated = insertListingSchema.partial().parse(req.body);
      const listing = await storage.updateListing(req.params.id, validated);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      res.json(listing);
    } catch (error) {
      console.error("Error updating listing:", error);
      res.status(400).json({ message: "Failed to update listing" });
    }
  });

  app.delete("/api/listings/:id", async (req, res) => {
    try {
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

  const httpServer = createServer(app);
  return httpServer;
}
