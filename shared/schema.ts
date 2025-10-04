import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  varchar,
  decimal,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Listings - combines vendor and product info (no auth needed)
export const listings = pgTable("listings", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  role: varchar("role").notNull(), // vendor or buyer
  vendorName: text("vendor_name").notNull(),
  itemName: text("item_name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  cropType: text("crop_type"), // e.g., vegetables, fruits, grains, livestock
  contactPhone: text("contact_phone").notNull(),
  contactEmail: text("contact_email").notNull(),
  imageUrl: text("image_url"),
  password: text("password").notNull(), // for vendor to delete their listing
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertListingSchema = createInsertSchema(listings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  contactEmail: z.string().email("Invalid email address"),
  contactPhone: z.string().min(10, "Phone number must be at least 10 digits"),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"),
  password: z.string().min(4, "Password must be at least 4 characters"),
});

export type InsertListing = z.infer<typeof insertListingSchema>;
export type Listing = typeof listings.$inferSelect;

// Crop Info - educational content about crops/food items
export const cropInfo = pgTable("crop_info", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  body: text("body").notNull(),
  mediaUrl: text("media_url"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCropInfoSchema = createInsertSchema(cropInfo).omit({
  id: true,
  createdAt: true,
});

export type InsertCropInfo = z.infer<typeof insertCropInfoSchema>;
export type CropInfo = typeof cropInfo.$inferSelect;
