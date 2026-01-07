import { sql } from '@vercel/postgres';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function migrate() {
  console.log('Updating change_logs table to support edits...');
  
  try {
    // Add before_snapshot and after_snapshot columns
    await sql`
      ALTER TABLE change_logs 
      ADD COLUMN IF NOT EXISTS before_snapshot JSONB,
      ADD COLUMN IF NOT EXISTS after_snapshot JSONB
    `;
    console.log('✅ Added before_snapshot and after_snapshot columns');

    // Update the check constraint to allow 'edit'
    await sql`ALTER TABLE change_logs DROP CONSTRAINT IF EXISTS change_logs_change_type_check`;
    await sql`ALTER TABLE change_logs ADD CONSTRAINT change_logs_change_type_check CHECK (change_type IN ('edit', 'deletion'))`;
    console.log('✅ Updated change_type constraint to allow edits');

    console.log('\n✅ Migration complete!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();

