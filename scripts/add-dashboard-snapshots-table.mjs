#!/usr/bin/env node

/**
 * Migration script to add dashboard_snapshots table for storing daily PDF snapshots
 */

import { sql } from '@vercel/postgres';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function migrate() {
  console.log('Creating dashboard_snapshots table...');
  
  try {
    // Create dashboard_snapshots table
    await sql`
      CREATE TABLE IF NOT EXISTS dashboard_snapshots (
        id SERIAL PRIMARY KEY,
        snapshot_date DATE NOT NULL UNIQUE,
        pdf_url TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ dashboard_snapshots table created');

    // Create index for snapshot_date
    await sql`
      CREATE INDEX IF NOT EXISTS idx_dashboard_snapshots_date ON dashboard_snapshots(snapshot_date DESC)
    `;
    console.log('✅ Index created on dashboard_snapshots.snapshot_date');

    console.log('\n✅ Migration complete!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();

