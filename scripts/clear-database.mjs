#!/usr/bin/env node

/**
 * Clear all data from the database
 * 
 * This script deletes all data from all tables:
 * - change_logs
 * - submission_logs
 * - estimates
 * - exit_multiples
 * - companies
 */

import { sql } from '@vercel/postgres';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

async function clearDatabase() {
  try {
    console.log('Starting database clear...\n');
    
    // Delete in order to respect foreign key constraints
    console.log('Deleting change_logs...');
    const changeLogsResult = await sql`DELETE FROM change_logs`;
    console.log(`  ✓ Deleted ${changeLogsResult.rowCount || 0} change log entries`);

    console.log('Deleting submission_logs...');
    const submissionLogsResult = await sql`DELETE FROM submission_logs`;
    console.log(`  ✓ Deleted ${submissionLogsResult.rowCount || 0} submission log entries`);

    console.log('Deleting estimates...');
    const estimatesResult = await sql`DELETE FROM estimates`;
    console.log(`  ✓ Deleted ${estimatesResult.rowCount || 0} estimate entries`);

    console.log('Deleting exit_multiples...');
    const exitMultiplesResult = await sql`DELETE FROM exit_multiples`;
    console.log(`  ✓ Deleted ${exitMultiplesResult.rowCount || 0} exit multiple entries`);

    console.log('Deleting companies...');
    const companiesResult = await sql`DELETE FROM companies`;
    console.log(`  ✓ Deleted ${companiesResult.rowCount || 0} company entries`);

    console.log('\n✅ Database cleared successfully!');
    console.log('All submissions and data have been removed.');
  } catch (error) {
    console.error('\n❌ Error clearing database:', error.message);
    throw error;
  }
}

clearDatabase().catch(console.error);

