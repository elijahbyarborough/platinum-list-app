#!/usr/bin/env node

/**
 * Migration script to reduce fiscal years from 11 to 8
 * Drops fy9, fy10, fy11 columns for both metrics and dividends
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

    console.log('Dropping fy9_metric column...');
    await client.query('ALTER TABLE companies DROP COLUMN IF EXISTS fy9_metric');
    
    console.log('Dropping fy10_metric column...');
    await client.query('ALTER TABLE companies DROP COLUMN IF EXISTS fy10_metric');
    
    console.log('Dropping fy11_metric column...');
    await client.query('ALTER TABLE companies DROP COLUMN IF EXISTS fy11_metric');
    
    console.log('Dropping fy9_div column...');
    await client.query('ALTER TABLE companies DROP COLUMN IF EXISTS fy9_div');
    
    console.log('Dropping fy10_div column...');
    await client.query('ALTER TABLE companies DROP COLUMN IF EXISTS fy10_div');
    
    console.log('Dropping fy11_div column...');
    await client.query('ALTER TABLE companies DROP COLUMN IF EXISTS fy11_div');

    console.log('Migration completed successfully! Fiscal years reduced from 11 to 8.');
  } catch (error) {
    console.error('Migration failed:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

migrate().catch(console.error);

