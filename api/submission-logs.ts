import type { VercelRequest, VercelResponse } from '@vercel/node';
import { findAllSubmissionLogs } from '../lib/models/submissionLog.js';
import { findCompanyById } from '../lib/models/company.js';
import { findExitMultiplesByCompanyId } from '../lib/models/exitMultiple.js';
import { calculate5YearIRR, hasSufficientDataForIRR } from '../lib/utils/irrCalculator.js';
import { Company } from '../lib/db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const logs = await findAllSubmissionLogs();
    
    // Enrich each log with company data and calculations
    const enrichedPromises = logs.map(async (log) => {
      // Parse snapshot data (company state at submission time)
      const snapshotCompany = JSON.parse(log.snapshot_data) as Company;
      
      // Get current company data for ticker and name
      const currentCompany = await findCompanyById(log.company_id!);
      
      // Get exit multiple from snapshot or current data
      const exitMultiples = await findExitMultiplesByCompanyId(log.company_id!, 5);
      const exitMultiple = exitMultiples.length > 0 ? exitMultiples[0].multiple : null;
      
      // Calculate IRR from snapshot data
      let irr: number | null = null;
      if (exitMultiple && hasSufficientDataForIRR(snapshotCompany)) {
        irr = calculate5YearIRR(snapshotCompany, exitMultiple);
      }
      
      return {
        id: log.id,
        ticker: currentCompany?.ticker || snapshotCompany.ticker,
        company_name: currentCompany?.company_name || snapshotCompany.company_name,
        price_at_submission: snapshotCompany.current_stock_price,
        exit_multiple: exitMultiple,
        metric_type: snapshotCompany.metric_type,
        irr_5yr: irr,
        submitted_at: log.submitted_at,
        analyst_initials: log.analyst_initials,
      };
    });

    const enriched = await Promise.all(enrichedPromises);
    
    return res.json(enriched);
  } catch (error) {
    console.error('Error fetching submission logs:', error);
    return res.status(500).json({ error: 'Failed to fetch submission logs' });
  }
}

