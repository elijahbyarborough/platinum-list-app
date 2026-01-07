#!/usr/bin/env node

/**
 * Migration script to restructure database:
 * 1. Add fiscal_year_end_month column to companies
 * 2. Create new estimates table
 * 3. Drop old fy1-fy8 columns from companies
 * 4. Drop old fiscal_year_end_date column
 */

import { createClient } from '@vercel/postgres';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

async function migrate() {
  const client = createClient();
  
  try {
    await client.connect();
    console.log('Connected to database');

    // Step 1: Add fiscal_year_end_month column if it doesn't exist
    console.log('Step 1: Adding fiscal_year_end_month column...');
    try {
      await client.query(`
        ALTER TABLE companies 
        ADD COLUMN IF NOT EXISTS fiscal_year_end_month INTEGER
      `);
      console.log('  Added fiscal_year_end_month column');
    } catch (e) {
      console.log('  fiscal_year_end_month column may already exist');
    }

    // Step 2: Migrate existing fiscal_year_end_date to fiscal_year_end_month
    console.log('Step 2: Migrating fiscal_year_end_date to fiscal_year_end_month...');
    await client.query(`
      UPDATE companies 
      SET fiscal_year_end_month = EXTRACT(MONTH FROM fiscal_year_end_date)::INTEGER
      WHERE fiscal_year_end_date IS NOT NULL AND fiscal_year_end_month IS NULL
    `);
    console.log('  Migrated fiscal_year_end_date values');

    // Set default for any null values
    await client.query(`
      UPDATE companies 
      SET fiscal_year_end_month = 12
      WHERE fiscal_year_end_month IS NULL
    `);

    // Make it NOT NULL with constraint
    await client.query(`
      ALTER TABLE companies 
      ALTER COLUMN fiscal_year_end_month SET NOT NULL
    `);
    
    // Add check constraint
    try {
      await client.query(`
        ALTER TABLE companies 
        ADD CONSTRAINT companies_fiscal_year_end_month_check 
        CHECK (fiscal_year_end_month BETWEEN 1 AND 12)
      `);
    } catch (e) {
      console.log('  Constraint may already exist');
    }

    // Step 3: Create estimates table
    console.log('Step 3: Creating estimates table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS estimates (
        id SERIAL PRIMARY KEY,
        company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        fiscal_year INTEGER NOT NULL,
        metric_value DECIMAL(12,4),
        dividend_value DECIMAL(12,4),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(company_id, fiscal_year)
      )
    `);
    console.log('  Created estimates table');

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_estimates_company_id ON estimates(company_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_estimates_fiscal_year ON estimates(fiscal_year)
    `);
    console.log('  Created indexes');

    // Create trigger function if it doesn't exist
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);
    console.log('  Created/updated trigger function');

    // Create trigger for updated_at
    await client.query(`
      DROP TRIGGER IF EXISTS update_estimates_updated_at ON estimates
    `);
    await client.query(`
      CREATE TRIGGER update_estimates_updated_at
        BEFORE UPDATE ON estimates
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `);
    console.log('  Created trigger');

    // Step 4: Drop old columns from companies table
    console.log('Step 4: Dropping old fiscal year columns...');
    const columnsToDropMetrics = ['fy1_metric', 'fy2_metric', 'fy3_metric', 'fy4_metric', 'fy5_metric', 'fy6_metric', 'fy7_metric', 'fy8_metric'];
    const columnsToDropDivs = ['fy1_div', 'fy2_div', 'fy3_div', 'fy4_div', 'fy5_div', 'fy6_div', 'fy7_div', 'fy8_div'];
    
    for (const col of [...columnsToDropMetrics, ...columnsToDropDivs]) {
      try {
        await client.query(`ALTER TABLE companies DROP COLUMN IF EXISTS ${col}`);
        console.log(`  Dropped column ${col}`);
      } catch (e) {
        console.log(`  Column ${col} may not exist`);
      }
    }

    // Drop fiscal_year_end_date column
    try {
      await client.query(`ALTER TABLE companies DROP COLUMN IF EXISTS fiscal_year_end_date`);
      console.log('  Dropped fiscal_year_end_date column');
    } catch (e) {
      console.log('  fiscal_year_end_date column may not exist');
    }

    console.log('\\nMigration completed successfully!');
    console.log('Database now uses estimates table with absolute fiscal years.');
  } catch (error) {
    console.error('Migration failed:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

migrate().catch(console.error);

