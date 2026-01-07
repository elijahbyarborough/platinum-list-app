import { Router } from 'express';
import { SubmissionLogModel } from '../models/SubmissionLog.js';
import { CompanyModel } from '../models/Company.js';
import { ExitMultipleModel } from '../models/ExitMultiple.js';
import { calculate5YearIRR, hasSufficientDataForIRR } from '../utils/irrCalculator.js';
import { Company } from '../models/types.js';

const router = Router();

// GET /api/submission-logs - Get all submission logs with enriched data
router.get('/', async (req, res) => {
  try {
    const logs = SubmissionLogModel.findAll();
    
    // Enrich each log with company data and calculations
    const enriched = logs.map(log => {
      // Parse snapshot data (company state at submission time)
      const snapshotCompany = JSON.parse(log.snapshot_data) as Company;
      
      // Get current company data for ticker and name
      const currentCompany = CompanyModel.findById(log.company_id!);
      
      // Get exit multiple from snapshot or current data
      const exitMultiples = ExitMultipleModel.findByCompanyId(log.company_id!, 5);
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
    
    res.json(enriched);
  } catch (error) {
    console.error('Error fetching submission logs:', error);
    res.status(500).json({ error: 'Failed to fetch submission logs' });
  }
});

export default router;

