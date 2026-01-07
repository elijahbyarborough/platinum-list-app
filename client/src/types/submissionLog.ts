export interface SubmissionLogEntry {
  id?: number;
  ticker: string;
  company_name: string;
  price_at_submission: number | null;
  exit_multiple: number | null;
  metric_type: string;
  irr_5yr: number | null;
  submitted_at?: string;
  analyst_initials: string;
}

