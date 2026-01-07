import { Estimate } from './company';

export interface ChangeSnapshot {
  submitted_at: string;
  original_submitted_at?: string;
  analyst_initials: string;
  exit_multiple: number | null;
  metric_type: string;
  estimates: Estimate[];
  irr_5yr: number | null;
  current_stock_price: number | null;
}

export interface EditChange {
  type: 'edit';
  ticker: string;
  company_name: string;
  changed_at: string;
  before: ChangeSnapshot;
  after: ChangeSnapshot;
}

export interface DeletionChange {
  type: 'deletion';
  ticker: string;
  company_name: string;
  changed_at: string;
  deleted: ChangeSnapshot;
}

export type Change = EditChange | DeletionChange;

// Legacy type for backwards compatibility
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

