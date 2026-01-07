import { sql } from '@vercel/postgres';

// Re-export sql for direct queries
export { sql };

// Type definitions
export type MetricType = 'EPS' | 'FCFPS' | 'Distributable Earnings' | 'P/B' | 'P/NAV';
export type Scenario = 'base' | 'bull' | 'bear';
export type AnalystInitials = 'EY' | 'TR' | 'JM' | 'BB' | 'NM';

export interface Company {
  id?: number;
  ticker: string;
  company_name: string;
  fiscal_year_end_date: string;
  metric_type: MetricType;
  current_stock_price: number | null;
  price_last_updated: string | null;
  scenario: Scenario;
  analyst_initials: AnalystInitials;
  created_at?: string;
  updated_at?: string;
  
  fy1_metric: number | null;
  fy2_metric: number | null;
  fy3_metric: number | null;
  fy4_metric: number | null;
  fy5_metric: number | null;
  fy6_metric: number | null;
  fy7_metric: number | null;
  fy8_metric: number | null;
  fy9_metric: number | null;
  fy10_metric: number | null;
  fy11_metric: number | null;
  
  fy1_div: number | null;
  fy2_div: number | null;
  fy3_div: number | null;
  fy4_div: number | null;
  fy5_div: number | null;
  fy6_div: number | null;
  fy7_div: number | null;
  fy8_div: number | null;
  fy9_div: number | null;
  fy10_div: number | null;
  fy11_div: number | null;
}

export interface ExitMultiple {
  id?: number;
  company_id: number;
  time_horizon_years: number;
  multiple: number;
  created_at?: string;
  updated_at?: string;
}

export interface SubmissionLog {
  id?: number;
  company_id: number;
  analyst_initials: AnalystInitials;
  submitted_at?: string;
  snapshot_data: string;
}

// Utility to convert database row to proper types
export function parseCompanyRow(row: any): Company {
  return {
    ...row,
    current_stock_price: row.current_stock_price ? Number(row.current_stock_price) : null,
    fy1_metric: row.fy1_metric ? Number(row.fy1_metric) : null,
    fy2_metric: row.fy2_metric ? Number(row.fy2_metric) : null,
    fy3_metric: row.fy3_metric ? Number(row.fy3_metric) : null,
    fy4_metric: row.fy4_metric ? Number(row.fy4_metric) : null,
    fy5_metric: row.fy5_metric ? Number(row.fy5_metric) : null,
    fy6_metric: row.fy6_metric ? Number(row.fy6_metric) : null,
    fy7_metric: row.fy7_metric ? Number(row.fy7_metric) : null,
    fy8_metric: row.fy8_metric ? Number(row.fy8_metric) : null,
    fy9_metric: row.fy9_metric ? Number(row.fy9_metric) : null,
    fy10_metric: row.fy10_metric ? Number(row.fy10_metric) : null,
    fy11_metric: row.fy11_metric ? Number(row.fy11_metric) : null,
    fy1_div: row.fy1_div ? Number(row.fy1_div) : null,
    fy2_div: row.fy2_div ? Number(row.fy2_div) : null,
    fy3_div: row.fy3_div ? Number(row.fy3_div) : null,
    fy4_div: row.fy4_div ? Number(row.fy4_div) : null,
    fy5_div: row.fy5_div ? Number(row.fy5_div) : null,
    fy6_div: row.fy6_div ? Number(row.fy6_div) : null,
    fy7_div: row.fy7_div ? Number(row.fy7_div) : null,
    fy8_div: row.fy8_div ? Number(row.fy8_div) : null,
    fy9_div: row.fy9_div ? Number(row.fy9_div) : null,
    fy10_div: row.fy10_div ? Number(row.fy10_div) : null,
    fy11_div: row.fy11_div ? Number(row.fy11_div) : null,
    fiscal_year_end_date: row.fiscal_year_end_date instanceof Date 
      ? row.fiscal_year_end_date.toISOString().split('T')[0]
      : row.fiscal_year_end_date,
  };
}

export function parseExitMultipleRow(row: any): ExitMultiple {
  return {
    ...row,
    multiple: row.multiple ? Number(row.multiple) : 0,
  };
}

