#!/usr/bin/env node

/**
 * Migration: Add metric_type column to estimates table
 * 
 * This migration:
 * 1. Adds metric_type column to estimates table
 * 2. Backfills existing estimates with their company's current metric_type
 * 3. Makes metric_type NOT NULL
 * 4. Updates the unique constraint to include metric_type
 * 5. Adds an index on metric_type for efficient queries
 */

import { sql } from '@vercel/postgres';
import { config } from 'dotenv';
import { existsSync } from 'fs';

// Load environment variables - prefer .env.production if it exists (for production migration)
// Otherwise use .env.local (for local development)
const envFile = existsSync('.env.production') ? '.env.production' : '.env.local';
config({ path: envFile });

console.log(`Loading environment from: ${envFile}`);

async function migrate() {
  try {
    console.log('Starting migration: Add metric_type to estimates table...\n');
    
    // Step 1: Check if column already exists
    console.log('Step 1: Checking if metric_type column already exists...');
    const columnCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'estimates' AND column_name = 'metric_type'
    `;
    
    if (columnCheck.rows.length > 0) {
      console.log('  ✓ metric_type column already exists, skipping column creation');
    } else {
      // Step 2: Add metric_type column as nullable first
      console.log('Step 2: Adding metric_type column (nullable)...');
      await sql`
        ALTER TABLE estimates 
        ADD COLUMN metric_type VARCHAR(30) 
        CHECK(metric_type IN ('GAAP EPS', 'Norm. EPS', 'Mgmt. EPS', 'FCFPS', 'DEPS', 'NAVPS', 'BVPS', 'DPS', 'Other'))
      `;
      console.log('  ✓ Column added');

      // Step 3: Backfill existing estimates with their company's metric_type
      console.log('Step 3: Backfilling existing estimates with company metric_type...');
      const updateResult = await sql`
        UPDATE estimates e
        SET metric_type = c.metric_type
        FROM companies c
        WHERE e.company_id = c.id AND e.metric_type IS NULL
      `;
      console.log(`  ✓ Updated ${updateResult.rowCount || 0} estimate rows`);

      // Step 4: Make the column NOT NULL
      console.log('Step 4: Making metric_type column NOT NULL...');
      await sql`
        ALTER TABLE estimates 
        ALTER COLUMN metric_type SET NOT NULL
      `;
      console.log('  ✓ Column is now NOT NULL');
    }

    // Step 5: Drop old unique constraint if it exists
    console.log('Step 5: Updating unique constraint...');
    try {
      await sql`
        ALTER TABLE estimates 
        DROP CONSTRAINT IF EXISTS estimates_company_id_fiscal_year_key
      `;
      console.log('  ✓ Old constraint dropped');
    } catch (e) {
      console.log('  ✓ Old constraint did not exist or already dropped');
    }

    // Step 6: Add new unique constraint including metric_type
    console.log('Step 6: Adding new unique constraint (company_id, fiscal_year, metric_type)...');
    try {
      await sql`
        ALTER TABLE estimates 
        ADD CONSTRAINT estimates_company_id_fiscal_year_metric_type_key 
        UNIQUE (company_id, fiscal_year, metric_type)
      `;
      console.log('  ✓ New constraint added');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('  ✓ New constraint already exists');
      } else {
        throw e;
      }
    }

    // Step 7: Add index on metric_type
    console.log('Step 7: Adding index on metric_type...');
    await sql`CREATE INDEX IF NOT EXISTS idx_estimates_metric_type ON estimates(metric_type)`;
    console.log('  ✓ Index created');

    console.log('\n✅ Migration completed successfully!');
    console.log('\nThe estimates table now supports multiple metric types per company.');
    console.log('Each fiscal year can have different estimates for different metric types.');
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    throw error;
  }
}

migrate().catch(console.error);

