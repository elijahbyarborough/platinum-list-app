#!/usr/bin/env node

/**
 * Migration script to update metric_type constraint to new values:
 * GAAP EPS, Norm. EPS, Mgmt. EPS, FCFPS, DEPS, NAVPS, BVPS
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

    // Drop the existing constraint and add a new one
    console.log('Updating metric_type constraint...');
    
    // First, drop the existing constraint
    await client.query(`
      ALTER TABLE companies 
      DROP CONSTRAINT IF EXISTS companies_metric_type_check
    `);
    console.log('Dropped old constraint');
    
    // Add the new constraint
    await client.query(`
      ALTER TABLE companies 
      ADD CONSTRAINT companies_metric_type_check 
      CHECK(metric_type IN ('GAAP EPS', 'Norm. EPS', 'Mgmt. EPS', 'FCFPS', 'DEPS', 'NAVPS', 'BVPS'))
    `);
    console.log('Added new constraint');

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

migrate().catch(console.error);

