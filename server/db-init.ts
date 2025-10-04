import { db } from "./db";
import { sql } from "drizzle-orm";

export async function initializeDatabase() {
  try {
    console.log("Initializing database tables...");

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

    // Create questions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS questions (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        author_name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("✓ Created questions table");

    // Create answers table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS answers (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        question_id VARCHAR NOT NULL,
        body TEXT NOT NULL,
        author_name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("✓ Created answers table");

    console.log("✓ Database initialization complete");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}
