import {
  listings,
  cropInfo,
  questions,
  answers,
  type Listing,
  type InsertListing,
  type CropInfo,
  type InsertCropInfo,
  type Question,
  type InsertQuestion,
  type Answer,
  type InsertAnswer,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, like, or, and, SQL, ilike, sql } from "drizzle-orm";

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

  // Question operations
  getQuestion(id: string): Promise<Question | undefined>;
  getAllQuestions(): Promise<Question[]>;
  searchQuestions(query: string): Promise<Question[]>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  deleteQuestion(id: string): Promise<void>;

  // Answer operations
  getAnswersByQuestionId(questionId: string): Promise<Answer[]>;
  createAnswer(answer: InsertAnswer): Promise<Answer>;
  deleteAnswer(id: string): Promise<void>;
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
    const conditions: SQL[] = [];

    if (filters?.role) {
      conditions.push(eq(listings.role, filters.role));
    }

    if (filters?.cropType) {
      conditions.push(eq(listings.cropType, filters.cropType));
    }

    if (filters?.search) {
      conditions.push(
        or(
          like(listings.itemName, `%${filters.search}%`),
          like(listings.description, `%${filters.search}%`),
          like(listings.vendorName, `%${filters.search}%`)
        )!
      );
    }

    let query = db.select().from(listings);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)!) as any;
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

  // Question operations
  async getQuestion(id: string): Promise<Question | undefined> {
    const [question] = await db
      .select()
      .from(questions)
      .where(eq(questions.id, id));
    return question;
  }

  async getAllQuestions(): Promise<Question[]> {
    return await db
      .select()
      .from(questions)
      .orderBy(desc(questions.createdAt));
  }

  async searchQuestions(query: string): Promise<Question[]> {
    // Extract keywords from the search query
    const keywords = query
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2); // Filter out short words like "to", "a", etc.

    if (keywords.length === 0) {
      return await this.getAllQuestions();
    }

    // Build search conditions for each keyword using ilike for case-insensitive search
    // Create an array of all conditions (title OR body for each keyword)
    const searchConditions: any[] = [];
    for (const keyword of keywords) {
      searchConditions.push(ilike(questions.title, `%${keyword}%`));
      searchConditions.push(ilike(questions.body, `%${keyword}%`));
    }

    // Combine all conditions with OR - match any keyword in either title or body
    return await db
      .select()
      .from(questions)
      .where(or(...searchConditions))
      .orderBy(desc(questions.createdAt));
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    const [newQuestion] = await db
      .insert(questions)
      .values(question)
      .returning();
    return newQuestion;
  }

  async deleteQuestion(id: string): Promise<void> {
    await db.delete(questions).where(eq(questions.id, id));
  }

  // Answer operations
  async getAnswersByQuestionId(questionId: string): Promise<Answer[]> {
    return await db
      .select()
      .from(answers)
      .where(eq(answers.questionId, questionId))
      .orderBy(desc(answers.createdAt));
  }

  async createAnswer(answer: InsertAnswer): Promise<Answer> {
    const [newAnswer] = await db
      .insert(answers)
      .values(answer)
      .returning();
    return newAnswer;
  }

  async deleteAnswer(id: string): Promise<void> {
    await db.delete(answers).where(eq(answers.id, id));
  }
}

export const storage = new DatabaseStorage();
