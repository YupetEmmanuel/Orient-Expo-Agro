import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function setupDatabase() {
  console.log("Creating database tables...");

  try {
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

    console.log("\n✨ Database setup complete!");
    process.exit(0);
  } catch (error) {
    console.error("Error setting up database:", error);
    process.exit(1);
  }
}

setupDatabase();
