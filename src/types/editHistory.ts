export interface EditComparison {
  ticker: string;
  company_name: string;
  before: {
    submitted_at: string;
    analyst_initials: string;
    exit_multiple: number | null;
    metric_type: string;
    metrics: (number | null)[];
    dividends: (number | null)[];
  };
  after: {
    submitted_at: string;
    analyst_initials: string;
    exit_multiple: number | null;
    metric_type: string;
    metrics: (number | null)[];
    dividends: (number | null)[];
  };
}

