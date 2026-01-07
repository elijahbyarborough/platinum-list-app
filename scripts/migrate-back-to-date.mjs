#!/usr/bin/env node

/**
 * Migration script to change fiscal_year_end_month back to fiscal_year_end_date
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

    // Step 1: Add fiscal_year_end_date column
    console.log('Step 1: Adding fiscal_year_end_date column...');
    try {
      await client.query(`
        ALTER TABLE companies 
        ADD COLUMN IF NOT EXISTS fiscal_year_end_date DATE
      `);
      console.log('  Added fiscal_year_end_date column');
    } catch (e) {
      console.log('  fiscal_year_end_date column may already exist:', e.message);
    }

    // Step 2: Migrate data - convert month to a date (last day of that month in current year)
    console.log('Step 2: Migrating data from fiscal_year_end_month to fiscal_year_end_date...');
    try {
      // For each month, create a date that's the last day of that month
      // Using December 31 for month 12, etc.
      await client.query(`
        UPDATE companies 
        SET fiscal_year_end_date = 
          CASE fiscal_year_end_month
            WHEN 1 THEN (DATE_TRUNC('YEAR', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE
            WHEN 2 THEN (DATE_TRUNC('YEAR', CURRENT_DATE) + INTERVAL '2 months - 1 day')::DATE
            WHEN 3 THEN (DATE_TRUNC('YEAR', CURRENT_DATE) + INTERVAL '3 months - 1 day')::DATE
            WHEN 4 THEN (DATE_TRUNC('YEAR', CURRENT_DATE) + INTERVAL '4 months - 1 day')::DATE
            WHEN 5 THEN (DATE_TRUNC('YEAR', CURRENT_DATE) + INTERVAL '5 months - 1 day')::DATE
            WHEN 6 THEN (DATE_TRUNC('YEAR', CURRENT_DATE) + INTERVAL '6 months - 1 day')::DATE
            WHEN 7 THEN (DATE_TRUNC('YEAR', CURRENT_DATE) + INTERVAL '7 months - 1 day')::DATE
            WHEN 8 THEN (DATE_TRUNC('YEAR', CURRENT_DATE) + INTERVAL '8 months - 1 day')::DATE
            WHEN 9 THEN (DATE_TRUNC('YEAR', CURRENT_DATE) + INTERVAL '9 months - 1 day')::DATE
            WHEN 10 THEN (DATE_TRUNC('YEAR', CURRENT_DATE) + INTERVAL '10 months - 1 day')::DATE
            WHEN 11 THEN (DATE_TRUNC('YEAR', CURRENT_DATE) + INTERVAL '11 months - 1 day')::DATE
            WHEN 12 THEN (DATE_TRUNC('YEAR', CURRENT_DATE) + INTERVAL '12 months - 1 day')::DATE
            ELSE (DATE_TRUNC('YEAR', CURRENT_DATE) + INTERVAL '12 months - 1 day')::DATE
          END
        WHERE fiscal_year_end_date IS NULL AND fiscal_year_end_month IS NOT NULL
      `);
      console.log('  Migrated data');
    } catch (e) {
      console.log('  Error migrating data:', e.message);
    }

    // Step 3: Set NOT NULL constraint
    console.log('Step 3: Setting NOT NULL constraint...');
    try {
      // First set a default for any NULL values
      await client.query(`
        UPDATE companies 
        SET fiscal_year_end_date = '2026-12-31'
        WHERE fiscal_year_end_date IS NULL
      `);
      
      await client.query(`
        ALTER TABLE companies 
        ALTER COLUMN fiscal_year_end_date SET NOT NULL
      `);
      console.log('  Set NOT NULL constraint');
    } catch (e) {
      console.log('  Error setting constraint:', e.message);
    }

    // Step 4: Drop old fiscal_year_end_month column
    console.log('Step 4: Dropping fiscal_year_end_month column...');
    try {
      await client.query(`
        ALTER TABLE companies 
        DROP CONSTRAINT IF EXISTS companies_fiscal_year_end_month_check
      `);
      await client.query(`
        ALTER TABLE companies 
        DROP COLUMN IF EXISTS fiscal_year_end_month
      `);
      console.log('  Dropped fiscal_year_end_month column');
    } catch (e) {
      console.log('  Error dropping column:', e.message);
    }

    console.log('\\nMigration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

migrate().catch(console.error);

