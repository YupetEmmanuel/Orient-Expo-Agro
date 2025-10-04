import {
  listings,
  cropInfo,
  type Listing,
  type InsertListing,
  type CropInfo,
  type InsertCropInfo,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, like, or } from "drizzle-orm";

export interface IStorage {
  // Listing operations
  getListing(id: string): Promise<Listing | undefined>;
  getListings(filters?: {
    role?: string;
    cropType?: string;
    search?: string;
  }): Promise<Listing[]>;
  createListing(listing: InsertListing): Promise<Listing>;
  updateListing(
    id: string,
    updates: Partial<InsertListing>
  ): Promise<Listing | undefined>;
  deleteListing(id: string): Promise<void>;

  // Crop Info operations
  getCropInfo(id: string): Promise<CropInfo | undefined>;
  getAllCropInfo(): Promise<CropInfo[]>;
  searchCropInfo(query: string): Promise<CropInfo[]>;
  createCropInfo(info: InsertCropInfo): Promise<CropInfo>;
  updateCropInfo(
    id: string,
    updates: Partial<InsertCropInfo>
  ): Promise<CropInfo | undefined>;
  deleteCropInfo(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Listing operations
  async getListing(id: string): Promise<Listing | undefined> {
    const [listing] = await db
      .select()
      .from(listings)
      .where(eq(listings.id, id));
    return listing;
  }

  async getListings(filters?: {
    role?: string;
    cropType?: string;
    search?: string;
  }): Promise<Listing[]> {
    let query = db.select().from(listings);

    if (filters?.role) {
      query = query.where(eq(listings.role, filters.role)) as any;
    }

    if (filters?.cropType) {
      query = query.where(eq(listings.cropType, filters.cropType)) as any;
    }

    if (filters?.search) {
      query = query.where(
        or(
          like(listings.itemName, `%${filters.search}%`),
          like(listings.description, `%${filters.search}%`),
          like(listings.vendorName, `%${filters.search}%`)
        )
      ) as any;
    }

    const results = await query.orderBy(desc(listings.createdAt));
    return results;
  }

  async createListing(listing: InsertListing): Promise<Listing> {
    const [newListing] = await db
      .insert(listings)
      .values(listing)
      .returning();
    return newListing;
  }

  async updateListing(
    id: string,
    updates: Partial<InsertListing>
  ): Promise<Listing | undefined> {
    const [updated] = await db
      .update(listings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(listings.id, id))
      .returning();
    return updated;
  }

  async deleteListing(id: string): Promise<void> {
    await db.delete(listings).where(eq(listings.id, id));
  }

  // Crop Info operations
  async getCropInfo(id: string): Promise<CropInfo | undefined> {
    const [info] = await db
      .select()
      .from(cropInfo)
      .where(eq(cropInfo.id, id));
    return info;
  }

  async getAllCropInfo(): Promise<CropInfo[]> {
    return await db
      .select()
      .from(cropInfo)
      .orderBy(desc(cropInfo.createdAt));
  }

  async searchCropInfo(query: string): Promise<CropInfo[]> {
    return await db
      .select()
      .from(cropInfo)
      .where(
        or(
          like(cropInfo.title, `%${query}%`),
          like(cropInfo.body, `%${query}%`)
        )
      )
      .orderBy(desc(cropInfo.createdAt));
  }

  async createCropInfo(info: InsertCropInfo): Promise<CropInfo> {
    const [newInfo] = await db
      .insert(cropInfo)
      .values(info)
      .returning();
    return newInfo;
  }

  async updateCropInfo(
    id: string,
    updates: Partial<InsertCropInfo>
  ): Promise<CropInfo | undefined> {
    const [updated] = await db
      .update(cropInfo)
      .set(updates)
      .where(eq(cropInfo.id, id))
      .returning();
    return updated;
  }

  async deleteCropInfo(id: string): Promise<void> {
    await db.delete(cropInfo).where(eq(cropInfo.id, id));
  }
}

export const storage = new DatabaseStorage();
