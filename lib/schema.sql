-- PostgreSQL Schema for Platinum List App
-- Run this against your Vercel Postgres database

-- Company table
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
  
  -- 11 years of metric estimates
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
  
  -- 11 years of dividend per share estimates
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
);

-- Exit Multiples table
CREATE TABLE IF NOT EXISTS exit_multiples (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  time_horizon_years INTEGER NOT NULL,
  multiple DECIMAL(8,4) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, time_horizon_years)
);

-- Submission Log table
CREATE TABLE IF NOT EXISTS submission_logs (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  analyst_initials VARCHAR(5) NOT NULL CHECK(analyst_initials IN ('EY', 'TR', 'JM', 'BB', 'NM')),
  submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  snapshot_data JSONB NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_companies_ticker ON companies(ticker);
CREATE INDEX IF NOT EXISTS idx_companies_updated_at ON companies(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_exit_multiples_company_id ON exit_multiples(company_id);
CREATE INDEX IF NOT EXISTS idx_submission_logs_company_id ON submission_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_submission_logs_submitted_at ON submission_logs(submitted_at DESC);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for auto-updating timestamps
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_exit_multiples_updated_at ON exit_multiples;
CREATE TRIGGER update_exit_multiples_updated_at
    BEFORE UPDATE ON exit_multiples
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

