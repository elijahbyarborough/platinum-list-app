import type { VercelRequest, VercelResponse } from '@vercel/node';
import { findAllSubmissionLogs } from '../lib/models/submissionLog.js';
import { findCompanyById } from '../lib/models/company.js';
import { findExitMultiplesByCompanyId } from '../lib/models/exitMultiple.js';
import { Company } from '../lib/db.js';

interface EditComparison {
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const allLogs = await findAllSubmissionLogs();
    
    // Group logs by company_id
    const logsByCompany = new Map<number, typeof allLogs>();
    for (const log of allLogs) {
      if (!logsByCompany.has(log.company_id)) {
        logsByCompany.set(log.company_id, []);
      }
      logsByCompany.get(log.company_id)!.push(log);
    }
    
    const comparisons: EditComparison[] = [];
    
    // For each company, compare consecutive submissions
    for (const [companyId, logs] of logsByCompany.entries()) {
      // Sort by submitted_at to ensure chronological order
      const sortedLogs = logs.sort((a, b) => {
        const dateA = new Date(a.submitted_at || 0).getTime();
        const dateB = new Date(b.submitted_at || 0).getTime();
        return dateA - dateB;
      });
      
      // Get current company info
      const company = await findCompanyById(companyId);
      if (!company) continue;
      
      // Get exit multiples
      const exitMultiples = await findExitMultiplesByCompanyId(companyId, 5);
      const exitMultiple = exitMultiples.length > 0 ? exitMultiples[0].multiple : null;
      
      // Compare each pair of consecutive submissions
      for (let i = 0; i < sortedLogs.length - 1; i++) {
        const beforeLog = sortedLogs[i];
        const afterLog = sortedLogs[i + 1];
        
        const beforeCompany = JSON.parse(beforeLog.snapshot_data) as Company;
        const afterCompany = JSON.parse(afterLog.snapshot_data) as Company;
        
        // Extract metrics and dividends arrays
        const beforeMetrics: (number | null)[] = [];
        const beforeDividends: (number | null)[] = [];
        const afterMetrics: (number | null)[] = [];
        const afterDividends: (number | null)[] = [];
        
        for (let j = 1; j <= 11; j++) {
          beforeMetrics.push(beforeCompany[`fy${j}_metric` as keyof Company] as number | null);
          beforeDividends.push(beforeCompany[`fy${j}_div` as keyof Company] as number | null);
          afterMetrics.push(afterCompany[`fy${j}_metric` as keyof Company] as number | null);
          afterDividends.push(afterCompany[`fy${j}_div` as keyof Company] as number | null);
        }
        
        comparisons.push({
          ticker: company.ticker,
          company_name: company.company_name,
          before: {
            submitted_at: beforeLog.submitted_at || '',
            analyst_initials: beforeLog.analyst_initials,
            exit_multiple: exitMultiple,
            metric_type: beforeCompany.metric_type,
            metrics: beforeMetrics,
            dividends: beforeDividends,
          },
          after: {
            submitted_at: afterLog.submitted_at || '',
            analyst_initials: afterLog.analyst_initials,
            exit_multiple: exitMultiple,
            metric_type: afterCompany.metric_type,
            metrics: afterMetrics,
            dividends: afterDividends,
          },
        });
      }
    }
    
    // Sort by most recent edit first
    comparisons.sort((a, b) => {
      const dateA = new Date(a.after.submitted_at).getTime();
      const dateB = new Date(b.after.submitted_at).getTime();
      return dateB - dateA;
    });
    
    return res.json(comparisons);
  } catch (error) {
    console.error('Error fetching edit history:', error);
    return res.status(500).json({ error: 'Failed to fetch edit history' });
  }
}

