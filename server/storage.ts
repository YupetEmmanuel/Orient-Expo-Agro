import {
  users,
  vendors,
  products,
  categories,
  productViews,
  contactClicks,
  type User,
  type UpsertUser,
  type Vendor,
  type InsertVendor,
  type Product,
  type InsertProduct,
  type Category,
  type InsertCategory,
  type ProductView,
  type InsertProductView,
  type InsertContactClick,
  type ContactClick,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, like, and, or } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserRole(id: string, role: string): Promise<User | undefined>;

  // Category operations
  getCategories(): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;

  // Vendor operations
  getVendor(id: string): Promise<Vendor | undefined>;
  getVendorByUserId(userId: string): Promise<Vendor | undefined>;
  getVendors(filters?: {
    status?: string;
    categoryId?: string;
  }): Promise<Vendor[]>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  updateVendor(
    id: string,
    updates: Partial<InsertVendor>
  ): Promise<Vendor | undefined>;
  updateVendorStatus(
    id: string,
    status: string
  ): Promise<Vendor | undefined>;

  // Product operations
  getProduct(id: string): Promise<Product | undefined>;
  getProducts(filters?: {
    vendorId?: string;
    categoryId?: string;
    status?: string;
    search?: string;
  }): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(
    id: string,
    updates: Partial<InsertProduct>
  ): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<void>;
  flagProduct(id: string, reason: string): Promise<Product | undefined>;

  // Analytics operations
  trackProductView(data: InsertProductView): Promise<ProductView>;
  trackContactClick(data: InsertContactClick): Promise<ContactClick>;
  getProductViewCount(productId: string): Promise<number>;
  getVendorAnalytics(vendorId: string): Promise<{
    productViews: { productId: string; productName: string; viewCount: number }[];
    contactClicks: { contactType: string; clickCount: number }[];
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    if (userData.email) {
      const existingUserByEmail = await db
        .select()
        .from(users)
        .where(eq(users.email, userData.email))
        .limit(1);
      
      if (existingUserByEmail.length > 0 && existingUserByEmail[0].id !== userData.id) {
        const [user] = await db
          .update(users)
          .set({ ...userData, updatedAt: new Date() })
          .where(eq(users.email, userData.email))
          .returning();
        return user;
      }
    }
    
    const { id, ...updateData } = userData;
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...updateData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserRole(id: string, role: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(asc(categories.name));
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug));
    return category;
  }

  async createCategory(categoryData: InsertCategory): Promise<Category> {
    const [category] = await db
      .insert(categories)
      .values(categoryData)
      .returning();
    return category;
  }

  // Vendor operations
  async getVendor(id: string): Promise<Vendor | undefined> {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.id, id));
    return vendor;
  }

  async getVendorByUserId(userId: string): Promise<Vendor | undefined> {
    const [vendor] = await db
      .select()
      .from(vendors)
      .where(eq(vendors.userId, userId));
    return vendor;
  }

  async getVendors(filters?: {
    status?: string;
    categoryId?: string;
  }): Promise<Vendor[]> {
    const conditions = [];
    if (filters?.status && filters.status !== 'all') {
      conditions.push(eq(vendors.status, filters.status));
    }
    if (filters?.categoryId) {
      conditions.push(eq(vendors.categoryId, filters.categoryId));
    }

    if (conditions.length > 0) {
      return await db
        .select()
        .from(vendors)
        .where(and(...conditions))
        .orderBy(desc(vendors.createdAt));
    }

    return await db.select().from(vendors).orderBy(desc(vendors.createdAt));
  }

  async createVendor(vendorData: InsertVendor): Promise<Vendor> {
    const [vendor] = await db.insert(vendors).values(vendorData).returning();
    return vendor;
  }

  async updateVendor(
    id: string,
    updates: Partial<InsertVendor>
  ): Promise<Vendor | undefined> {
    const [vendor] = await db
      .update(vendors)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(vendors.id, id))
      .returning();
    return vendor;
  }

  async updateVendorStatus(
    id: string,
    status: string
  ): Promise<Vendor | undefined> {
    const [vendor] = await db
      .update(vendors)
      .set({ status, updatedAt: new Date() })
      .where(eq(vendors.id, id))
      .returning();
    return vendor;
  }

  // Product operations
  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id));
    return product;
  }

  async getProducts(filters?: {
    vendorId?: string;
    categoryId?: string;
    status?: string;
    search?: string;
  }): Promise<Product[]> {
    const conditions = [];
    if (filters?.vendorId) {
      conditions.push(eq(products.vendorId, filters.vendorId));
    }
    if (filters?.categoryId) {
      conditions.push(eq(products.categoryId, filters.categoryId));
    }
    if (filters?.status) {
      conditions.push(eq(products.status, filters.status));
    }
    if (filters?.search) {
      conditions.push(
        or(
          like(products.name, `%${filters.search}%`),
          like(products.description, `%${filters.search}%`)
        )
      );
    }

    if (conditions.length > 0) {
      return await db
        .select()
        .from(products)
        .where(and(...conditions))
        .orderBy(desc(products.createdAt));
    }

    return await db.select().from(products).orderBy(desc(products.createdAt));
  }

  async createProduct(productData: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(productData).returning();
    return product;
  }

  async updateProduct(
    id: string,
    updates: Partial<InsertProduct>
  ): Promise<Product | undefined> {
    const [product] = await db
      .update(products)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async deleteProduct(id: string): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async flagProduct(id: string, reason: string): Promise<Product | undefined> {
    const [product] = await db
      .update(products)
      .set({ status: "flagged", flagReason: reason, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  // Analytics operations
  async trackProductView(data: InsertProductView): Promise<ProductView> {
    const [view] = await db.insert(productViews).values(data).returning();
    return view;
  }

  async trackContactClick(data: InsertContactClick): Promise<ContactClick> {
    const [click] = await db.insert(contactClicks).values(data).returning();
    return click;
  }

  async getProductViewCount(productId: string): Promise<number> {
    const result = await db
      .select()
      .from(productViews)
      .where(eq(productViews.productId, productId));
    return result.length;
  }

  async getVendorAnalytics(vendorId: string): Promise<{
    productViews: { productId: string; productName: string; viewCount: number }[];
    contactClicks: { contactType: string; clickCount: number }[];
  }> {
    const vendorProducts = await db
      .select()
      .from(products)
      .where(eq(products.vendorId, vendorId));

    const productViewsData = await Promise.all(
      vendorProducts.map(async (product) => {
        const views = await db
          .select()
          .from(productViews)
          .where(eq(productViews.productId, product.id));
        return {
          productId: product.id,
          productName: product.name,
          viewCount: views.length,
        };
      })
    );

    const clicks = await db
      .select()
      .from(contactClicks)
      .where(eq(contactClicks.vendorId, vendorId));

    const contactClicksData = clicks.reduce((acc, click) => {
      const existing = acc.find((item) => item.contactType === click.contactType);
      if (existing) {
        existing.clickCount++;
      } else {
        acc.push({ contactType: click.contactType, clickCount: 1 });
      }
      return acc;
    }, [] as { contactType: string; clickCount: number }[]);

    return {
      productViews: productViewsData,
      contactClicks: contactClicksData,
    };
  }
}

export const storage = new DatabaseStorage();
