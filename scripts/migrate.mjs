#!/usr/bin/env node

/**
 * Initial database migration script for Platinum List App
 * Creates all tables from scratch
 */

import { sql } from '@vercel/postgres';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

async function migrate() {
  try {
    console.log('Starting database migration...');
    
    console.log('Creating companies table...');
    await sql`
      CREATE TABLE IF NOT EXISTS companies (
        id SERIAL PRIMARY KEY,
        ticker VARCHAR(10) NOT NULL UNIQUE,
        company_name TEXT NOT NULL,
        fiscal_year_end_date DATE NOT NULL,
        metric_type VARCHAR(30) NOT NULL CHECK(metric_type IN ('GAAP EPS', 'Norm. EPS', 'Mgmt. EPS', 'FCFPS', 'DEPS', 'NAVPS', 'BVPS')),
        current_stock_price DECIMAL(12,4),
        price_last_updated TIMESTAMPTZ,
        scenario VARCHAR(10) NOT NULL DEFAULT 'base' CHECK(scenario IN ('base', 'bull', 'bear')),
        analyst_initials VARCHAR(5) NOT NULL CHECK(analyst_initials IN ('EY', 'TR', 'JM', 'BB', 'NM')),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    console.log('Creating estimates table...');
    await sql`
      CREATE TABLE IF NOT EXISTS estimates (
        id SERIAL PRIMARY KEY,
        company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        fiscal_year INTEGER NOT NULL,
        metric_type VARCHAR(30) NOT NULL CHECK(metric_type IN ('GAAP EPS', 'Norm. EPS', 'Mgmt. EPS', 'FCFPS', 'DEPS', 'NAVPS', 'BVPS')),
        metric_value DECIMAL(12,4),
        dividend_value DECIMAL(12,4),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(company_id, fiscal_year, metric_type)
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
    await sql`CREATE INDEX IF NOT EXISTS idx_estimates_company_id ON estimates(company_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_estimates_fiscal_year ON estimates(fiscal_year)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_estimates_metric_type ON estimates(metric_type)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_exit_multiples_company_id ON exit_multiples(company_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_submission_logs_company_id ON submission_logs(company_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_submission_logs_submitted_at ON submission_logs(submitted_at DESC)`;

    console.log('Creating update_updated_at_column function...');
    await sql`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql'
    `;

    console.log('Creating triggers...');
    await sql`DROP TRIGGER IF EXISTS update_companies_updated_at ON companies`;
    await sql`
      CREATE TRIGGER update_companies_updated_at
        BEFORE UPDATE ON companies
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `;

    await sql`DROP TRIGGER IF EXISTS update_estimates_updated_at ON estimates`;
    await sql`
      CREATE TRIGGER update_estimates_updated_at
        BEFORE UPDATE ON estimates
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `;

    await sql`DROP TRIGGER IF EXISTS update_exit_multiples_updated_at ON exit_multiples`;
    await sql`
      CREATE TRIGGER update_exit_multiples_updated_at
        BEFORE UPDATE ON exit_multiples
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `;

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error.message);
    throw error;
  }
}

migrate().catch(console.error);
