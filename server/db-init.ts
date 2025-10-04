import { db } from "./db";
import { sql } from "drizzle-orm";

export async function initializeDatabase() {
  try {
    console.log("Checking database tables...");
    
    // Check if tables exist by trying to query them
    try {
      await db.execute(sql`SELECT 1 FROM listings LIMIT 1`);
      console.log("✓ Database tables already exist");
      return;
    } catch (error) {
      console.log("Database tables don't exist, creating them...");
    }

    // Create listings table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS listings (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        role VARCHAR NOT NULL,
        vendor_name TEXT NOT NULL,
        item_name TEXT NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        crop_type TEXT,
        contact_phone TEXT NOT NULL,
        contact_email TEXT NOT NULL,
        image_url TEXT,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("✓ Created listings table");

    // Create crop_info table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS crop_info (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        media_url TEXT,
        tags TEXT[],
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("✓ Created crop_info table");

    console.log("✓ Database initialization complete");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}
