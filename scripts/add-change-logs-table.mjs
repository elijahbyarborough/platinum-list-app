import { sql } from '@vercel/postgres';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function migrate() {
  console.log('Creating change_logs table...');
  
  try {
    // Create change_logs table
    await sql`
      CREATE TABLE IF NOT EXISTS change_logs (
        id SERIAL PRIMARY KEY,
        ticker VARCHAR(10) NOT NULL,
        company_name TEXT NOT NULL,
        change_type VARCHAR(20) NOT NULL CHECK(change_type IN ('deletion')),
        analyst_initials VARCHAR(5) NOT NULL,
        changed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        snapshot_data JSONB NOT NULL
      )
    `;
    console.log('✅ change_logs table created');

    // Create index for changed_at
    await sql`
      CREATE INDEX IF NOT EXISTS idx_change_logs_changed_at ON change_logs(changed_at DESC)
    `;
    console.log('✅ Index created on change_logs.changed_at');

    console.log('\n✅ Migration complete!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();

