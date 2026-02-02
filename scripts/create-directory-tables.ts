import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function createDirectoryTables() {
  console.log("Creating directory tables...");

  // Create directory_categories table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS directory_categories (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      icon_url TEXT,
      parent_category_id INTEGER REFERENCES directory_categories(id),
      status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
      seo_title TEXT,
      seo_description TEXT,
      display_order INTEGER NOT NULL DEFAULT 0,
      listing_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  console.log("Created directory_categories table");

  // Create directory_profiles table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS directory_profiles (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR NOT NULL UNIQUE REFERENCES users(id),
      company_slug TEXT NOT NULL UNIQUE,
      company_name TEXT NOT NULL,
      company_description TEXT,
      company_logo_url TEXT,
      website_url TEXT,
      phone_number TEXT,
      email TEXT,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      zip_code TEXT,
      latitude TEXT,
      longitude TEXT,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      show_on_directory BOOLEAN NOT NULL DEFAULT TRUE,
      meta_description TEXT,
      total_services INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  console.log("Created directory_profiles table");

  // Create directory_service_listings table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS directory_service_listings (
      id SERIAL PRIMARY KEY,
      directory_profile_id INTEGER NOT NULL REFERENCES directory_profiles(id) ON DELETE CASCADE,
      formula_id INTEGER NOT NULL REFERENCES formulas(id) ON DELETE CASCADE,
      category_id INTEGER NOT NULL REFERENCES directory_categories(id),
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      display_order INTEGER NOT NULL DEFAULT 0,
      custom_display_name TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  console.log("Created directory_service_listings table");

  // Create directory_service_areas table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS directory_service_areas (
      id SERIAL PRIMARY KEY,
      directory_profile_id INTEGER NOT NULL REFERENCES directory_profiles(id) ON DELETE CASCADE,
      area_type VARCHAR(20) NOT NULL DEFAULT 'radius' CHECK (area_type IN ('radius', 'zip_codes', 'cities', 'states')),
      radius_miles INTEGER,
      center_latitude TEXT,
      center_longitude TEXT,
      zip_codes JSONB,
      cities JSONB,
      states JSONB,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  console.log("Created directory_service_areas table");

  // Create directory_index_cache table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS directory_index_cache (
      id SERIAL PRIMARY KEY,
      category_id INTEGER NOT NULL REFERENCES directory_categories(id),
      category_slug TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      city_slug TEXT NOT NULL,
      profile_ids JSONB NOT NULL,
      profile_count INTEGER NOT NULL,
      is_indexable BOOLEAN NOT NULL DEFAULT FALSE,
      last_updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  console.log("Created directory_index_cache table");

  // Create indexes
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS directory_index_cache_category_city_idx
    ON directory_index_cache(category_slug, city_slug)
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS directory_index_cache_category_idx
    ON directory_index_cache(category_id)
  `);
  console.log("Created indexes");

  // Seed initial approved categories
  await db.execute(sql`
    INSERT INTO directory_categories (name, slug, status, display_order, seo_title, seo_description)
    VALUES
      ('Pressure Washing', 'pressure-washing', 'approved', 1, 'Pressure Washing Services', 'Find local pressure washing professionals with instant pricing'),
      ('Window Cleaning', 'window-cleaning', 'approved', 2, 'Window Cleaning Services', 'Find local window cleaning professionals with instant pricing'),
      ('House Cleaning', 'house-cleaning', 'approved', 3, 'House Cleaning Services', 'Find local house cleaning professionals with instant pricing'),
      ('Lawn Care', 'lawn-care', 'approved', 4, 'Lawn Care Services', 'Find local lawn care professionals with instant pricing'),
      ('Gutter Cleaning', 'gutter-cleaning', 'approved', 5, 'Gutter Cleaning Services', 'Find local gutter cleaning professionals with instant pricing'),
      ('Roof Cleaning', 'roof-cleaning', 'approved', 6, 'Roof Cleaning Services', 'Find local roof cleaning professionals with instant pricing'),
      ('Carpet Cleaning', 'carpet-cleaning', 'approved', 7, 'Carpet Cleaning Services', 'Find local carpet cleaning professionals with instant pricing'),
      ('Pool Cleaning', 'pool-cleaning', 'approved', 8, 'Pool Cleaning Services', 'Find local pool cleaning professionals with instant pricing'),
      ('HVAC Services', 'hvac-services', 'approved', 9, 'HVAC Services', 'Find local HVAC professionals with instant pricing'),
      ('Painting', 'painting', 'approved', 10, 'Painting Services', 'Find local painting professionals with instant pricing'),
      ('Landscaping', 'landscaping', 'approved', 11, 'Landscaping Services', 'Find local landscaping professionals with instant pricing'),
      ('Junk Removal', 'junk-removal', 'approved', 12, 'Junk Removal Services', 'Find local junk removal professionals with instant pricing'),
      ('Moving Services', 'moving-services', 'approved', 13, 'Moving Services', 'Find local moving professionals with instant pricing'),
      ('Handyman Services', 'handyman-services', 'approved', 14, 'Handyman Services', 'Find local handyman professionals with instant pricing'),
      ('Pest Control', 'pest-control', 'approved', 15, 'Pest Control Services', 'Find local pest control professionals with instant pricing'),
      ('Concrete Services', 'concrete-services', 'approved', 16, 'Concrete Services', 'Find local concrete professionals with instant pricing'),
      ('Deck Staining', 'deck-staining', 'approved', 17, 'Deck Staining Services', 'Find local deck staining professionals with instant pricing'),
      ('Christmas Lights', 'christmas-lights', 'approved', 18, 'Christmas Lights Installation', 'Find local Christmas lights professionals with instant pricing'),
      ('Solar Panel Cleaning', 'solar-panel-cleaning', 'approved', 19, 'Solar Panel Cleaning Services', 'Find local solar panel cleaning professionals with instant pricing'),
      ('Driveway Sealing', 'driveway-sealing', 'approved', 20, 'Driveway Sealing Services', 'Find local driveway sealing professionals with instant pricing')
    ON CONFLICT (slug) DO NOTHING
  `);
  console.log("Seeded initial categories");

  console.log("All directory tables created successfully!");
  process.exit(0);
}

createDirectoryTables().catch((err) => {
  console.error("Error creating tables:", err);
  process.exit(1);
});
