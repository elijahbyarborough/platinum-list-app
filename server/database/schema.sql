-- Company table
CREATE TABLE IF NOT EXISTS companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticker TEXT NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  fiscal_year_end_date DATE NOT NULL,
  metric_type TEXT NOT NULL CHECK(metric_type IN ('EPS', 'FCFPS', 'Distributable Earnings', 'P/B', 'P/NAV')),
  current_stock_price REAL,
  price_last_updated TIMESTAMP,
  scenario TEXT NOT NULL DEFAULT 'base' CHECK(scenario IN ('base', 'bull', 'bear')),
  analyst_initials TEXT NOT NULL CHECK(analyst_initials IN ('EY', 'TR', 'JM', 'BB', 'NM')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- 11 years of metric estimates
  fy1_metric REAL,
  fy2_metric REAL,
  fy3_metric REAL,
  fy4_metric REAL,
  fy5_metric REAL,
  fy6_metric REAL,
  fy7_metric REAL,
  fy8_metric REAL,
  fy9_metric REAL,
  fy10_metric REAL,
  fy11_metric REAL,
  
  -- 11 years of dividend per share estimates
  fy1_div REAL,
  fy2_div REAL,
  fy3_div REAL,
  fy4_div REAL,
  fy5_div REAL,
  fy6_div REAL,
  fy7_div REAL,
  fy8_div REAL,
  fy9_div REAL,
  fy10_div REAL,
  fy11_div REAL
);

-- Exit Multiples table
CREATE TABLE IF NOT EXISTS exit_multiples (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  time_horizon_years INTEGER NOT NULL,
  multiple REAL NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  UNIQUE(company_id, time_horizon_years)
);

-- Submission Log table
CREATE TABLE IF NOT EXISTS submission_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  analyst_initials TEXT NOT NULL CHECK(analyst_initials IN ('EY', 'TR', 'JM', 'BB', 'NM')),
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  snapshot_data TEXT NOT NULL, -- JSON string
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_companies_ticker ON companies(ticker);
CREATE INDEX IF NOT EXISTS idx_exit_multiples_company_id ON exit_multiples(company_id);
CREATE INDEX IF NOT EXISTS idx_submission_logs_company_id ON submission_logs(company_id);

