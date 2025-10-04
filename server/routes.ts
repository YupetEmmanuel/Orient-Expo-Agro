import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertListingSchema,
  insertCropInfoSchema,
} from "@shared/schema";

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
