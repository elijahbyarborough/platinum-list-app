import { sql } from '@vercel/postgres';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

async function migrate() {
  console.log('Running database migration...');
  
  try {
    // Create tables one by one
    console.log('Creating companies table...');
    await sql`
      CREATE TABLE IF NOT EXISTS companies (
        id SERIAL PRIMARY KEY,
        ticker VARCHAR(10) NOT NULL UNIQUE,
        company_name TEXT NOT NULL,
        fiscal_year_end_date DATE NOT NULL,
        metric_type VARCHAR(30) NOT NULL CHECK(metric_type IN ('EPS', 'FCFPS', 'Distributable Earnings', 'P/B', 'P/NAV')),
        current_stock_price DECIMAL(12,4),
        price_last_updated TIMESTAMPTZ,
        scenario VARCHAR(10) NOT NULL DEFAULT 'base' CHECK(scenario IN ('base', 'bull', 'bear')),
        analyst_initials VARCHAR(5) NOT NULL CHECK(analyst_initials IN ('EY', 'TR', 'JM', 'BB', 'NM')),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        fy1_metric DECIMAL(12,4),
        fy2_metric DECIMAL(12,4),
        fy3_metric DECIMAL(12,4),
        fy4_metric DECIMAL(12,4),
        fy5_metric DECIMAL(12,4),
        fy6_metric DECIMAL(12,4),
        fy7_metric DECIMAL(12,4),
        fy8_metric DECIMAL(12,4),
        fy9_metric DECIMAL(12,4),
        fy10_metric DECIMAL(12,4),
        fy11_metric DECIMAL(12,4),
        fy1_div DECIMAL(12,4),
        fy2_div DECIMAL(12,4),
        fy3_div DECIMAL(12,4),
        fy4_div DECIMAL(12,4),
        fy5_div DECIMAL(12,4),
        fy6_div DECIMAL(12,4),
        fy7_div DECIMAL(12,4),
        fy8_div DECIMAL(12,4),
        fy9_div DECIMAL(12,4),
        fy10_div DECIMAL(12,4),
        fy11_div DECIMAL(12,4)
      )
    `;
    
    console.log('Creating exit_multiples table...');
    await sql`
      CREATE TABLE IF NOT EXISTS exit_multiples (
        id SERIAL PRIMARY KEY,
        company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        time_horizon_years INTEGER NOT NULL,
        multiple DECIMAL(8,4) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(company_id, time_horizon_years)
      )
    `;
    
    console.log('Creating submission_logs table...');
    await sql`
      CREATE TABLE IF NOT EXISTS submission_logs (
        id SERIAL PRIMARY KEY,
        company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        analyst_initials VARCHAR(5) NOT NULL CHECK(analyst_initials IN ('EY', 'TR', 'JM', 'BB', 'NM')),
        submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        snapshot_data JSONB NOT NULL
      )
    `;
    
    console.log('Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_companies_ticker ON companies(ticker)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_companies_updated_at ON companies(updated_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_exit_multiples_company_id ON exit_multiples(company_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_submission_logs_company_id ON submission_logs(company_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_submission_logs_submitted_at ON submission_logs(submitted_at DESC)`;
    
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

migrate();
