import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import {
  insertVendorSchema,
  insertProductSchema,
  insertCategorySchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Category routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const validated = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validated);
      res.json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(400).json({ message: "Failed to create category" });
    }
  });

  // Vendor routes
  app.get("/api/vendors/me", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const vendor = await storage.getVendorByUserId(userId);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      res.json(vendor);
    } catch (error) {
      console.error("Error fetching current vendor:", error);
      res.status(500).json({ message: "Failed to fetch vendor" });
    }
  });

  app.get("/api/vendors", async (req, res) => {
    try {
      const { status, categoryId } = req.query;
      const vendors = await storage.getVendors({
        status: status as string,
        categoryId: categoryId as string,
      });
      res.json(vendors);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      res.status(500).json({ message: "Failed to fetch vendors" });
    }
  });

  app.get("/api/vendors/:id", async (req, res) => {
    try {
      const vendor = await storage.getVendor(req.params.id);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      res.json(vendor);
    } catch (error) {
      console.error("Error fetching vendor:", error);
      res.status(500).json({ message: "Failed to fetch vendor" });
    }
  });

  app.post("/api/vendors", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Check if user already has a vendor
      const existingVendor = await storage.getVendorByUserId(userId);
      if (existingVendor) {
        return res.status(400).json({ message: "User already has a vendor" });
      }

      const validated = insertVendorSchema.parse({
        ...req.body,
        userId,
      });
      const vendor = await storage.createVendor(validated);
      
      // Update user role to vendor
      await storage.updateUserRole(userId, "vendor");
      
      res.json(vendor);
    } catch (error) {
      console.error("Error creating vendor:", error);
      res.status(400).json({ message: "Failed to create vendor" });
    }
  });

  app.patch("/api/vendors/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const vendor = await storage.getVendor(req.params.id);
      
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      
      if (vendor.userId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const updated = await storage.updateVendor(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating vendor:", error);
      res.status(400).json({ message: "Failed to update vendor" });
    }
  });

  app.patch("/api/vendors/:id/status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { status } = req.body;
      const vendor = await storage.updateVendorStatus(req.params.id, status);
      res.json(vendor);
    } catch (error) {
      console.error("Error updating vendor status:", error);
      res.status(400).json({ message: "Failed to update vendor status" });
    }
  });

  // Product routes
  app.get("/api/products", async (req, res) => {
    try {
      const { vendorId, categoryId, status, search } = req.query;
      const products = await storage.getProducts({
        vendorId: vendorId as string,
        categoryId: categoryId as string,
        status: status as string,
        search: search as string,
      });
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post("/api/products", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const vendor = await storage.getVendorByUserId(userId);
      
      if (!vendor || vendor.status !== "approved") {
        return res.status(403).json({ message: "Approved vendor account required" });
      }

      const validated = insertProductSchema.parse({
        ...req.body,
        vendorId: vendor.id,
      });
      const product = await storage.createProduct(validated);
      res.json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(400).json({ message: "Failed to create product" });
    }
  });

  app.patch("/api/products/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const product = await storage.getProduct(req.params.id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      const vendor = await storage.getVendor(product.vendorId);
      if (vendor?.userId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const updated = await storage.updateProduct(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(400).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const product = await storage.getProduct(req.params.id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      const vendor = await storage.getVendor(product.vendorId);
      if (vendor?.userId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      await storage.deleteProduct(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(400).json({ message: "Failed to delete product" });
    }
  });

  app.post("/api/products/:id/flag", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { reason } = req.body;
      const product = await storage.flagProduct(req.params.id, reason);
      res.json(product);
    } catch (error) {
      console.error("Error flagging product:", error);
      res.status(400).json({ message: "Failed to flag product" });
    }
  });

  // Object Storage routes
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path
      );
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error accessing object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    res.json({ uploadURL });
  });

  app.put("/api/vendor-logo", isAuthenticated, async (req: any, res) => {
    if (!req.body.logoUrl) {
      return res.status(400).json({ error: "logoUrl is required" });
    }

    const userId = req.user.claims.sub;

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = objectStorageService.normalizeObjectEntityPath(
        req.body.logoUrl
      );

      const vendor = await storage.getVendorByUserId(userId);
      if (!vendor) {
        return res.status(404).json({ error: "Vendor not found" });
      }

      await storage.updateVendor(vendor.id, { logoUrl: objectPath });

      res.status(200).json({ objectPath });
    } catch (error) {
      console.error("Error setting vendor logo:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/product-image", isAuthenticated, async (req: any, res) => {
    if (!req.body.imageUrl || !req.body.productId) {
      return res.status(400).json({ error: "imageUrl and productId are required" });
    }

    const userId = req.user.claims.sub;

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = objectStorageService.normalizeObjectEntityPath(
        req.body.imageUrl
      );

      const product = await storage.getProduct(req.body.productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      const vendor = await storage.getVendor(product.vendorId);
      if (vendor?.userId !== userId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      await storage.updateProduct(product.id, { imageUrl: objectPath });

      res.status(200).json({ objectPath });
    } catch (error) {
      console.error("Error setting product image:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
