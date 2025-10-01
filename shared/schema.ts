import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("customer"), // customer, vendor, admin
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Categories
export const categories = pgTable("categories", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  slug: true,
});

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

// Vendors
export const vendors = pgTable("vendors", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  storeName: text("store_name").notNull(),
  description: text("description"),
  logoUrl: text("logo_url"),
  categoryId: varchar("category_id").references(() => categories.id),
  phone: text("phone"),
  whatsapp: text("whatsapp"),
  email: text("email"),
  status: varchar("status").notNull().default("pending"), // pending, approved, rejected
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const vendorsRelations = relations(vendors, ({ one, many }) => ({
  user: one(users, {
    fields: [vendors.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [vendors.categoryId],
    references: [categories.id],
  }),
  products: many(products),
}));

export const insertVendorSchema = createInsertSchema(vendors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type Vendor = typeof vendors.$inferSelect;

// Products
export const products = pgTable("products", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id")
    .notNull()
    .references(() => vendors.id),
  categoryId: varchar("category_id").references(() => categories.id),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  status: varchar("status").notNull().default("active"), // active, pending, flagged, removed
  flagReason: text("flag_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const productsRelations = relations(products, ({ one }) => ({
  vendor: one(vendors, {
    fields: [products.vendorId],
    references: [vendors.id],
  }),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
}));

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// Analytics - Product Views
export const productViews = pgTable("product_views", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  productId: varchar("product_id")
    .notNull()
    .references(() => products.id),
  userId: varchar("user_id").references(() => users.id),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const productViewsRelations = relations(productViews, ({ one }) => ({
  product: one(products, {
    fields: [productViews.productId],
    references: [products.id],
  }),
  user: one(users, {
    fields: [productViews.userId],
    references: [users.id],
  }),
}));

export const insertProductViewSchema = createInsertSchema(productViews).omit({
  id: true,
  createdAt: true,
});

export type InsertProductView = z.infer<typeof insertProductViewSchema>;
export type ProductView = typeof productViews.$inferSelect;

// Analytics - Contact Clicks
export const contactClicks = pgTable("contact_clicks", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id")
    .notNull()
    .references(() => vendors.id),
  contactType: varchar("contact_type").notNull(), // phone, whatsapp, email
  userId: varchar("user_id").references(() => users.id),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const contactClicksRelations = relations(contactClicks, ({ one }) => ({
  vendor: one(vendors, {
    fields: [contactClicks.vendorId],
    references: [vendors.id],
  }),
  user: one(users, {
    fields: [contactClicks.userId],
    references: [users.id],
  }),
}));

export const insertContactClickSchema = createInsertSchema(contactClicks).omit({
  id: true,
  createdAt: true,
});

export type InsertContactClick = z.infer<typeof insertContactClickSchema>;
export type ContactClick = typeof contactClicks.$inferSelect;
