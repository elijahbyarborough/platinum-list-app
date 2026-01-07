export type MetricType = 'EPS' | 'FCFPS' | 'Distributable Earnings' | 'P/B' | 'P/NAV';
export type Scenario = 'base' | 'bull' | 'bear';
export type AnalystInitials = 'EY' | 'TR' | 'JM' | 'BB' | 'NM';

export interface Company {
  id?: number;
  ticker: string;
  company_name: string;
  fiscal_year_end_date: string; // ISO date string
  metric_type: MetricType;
  current_stock_price: number | null;
  price_last_updated: string | null;
  scenario: Scenario;
  analyst_initials: AnalystInitials;
  created_at?: string;
  updated_at?: string;
  
  // 11 years of metric estimates
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
  
  // 11 years of dividend estimates
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
  snapshot_data: string; // JSON string
}

