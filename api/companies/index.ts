import type { VercelRequest, VercelResponse } from '@vercel/node';
import { findMostRecentCompany, upsertCompanyByTicker, findCompanyById } from '../../lib/models/company.js';
import { findExitMultiplesByCompanyId, upsertExitMultiple } from '../../lib/models/exitMultiple.js';
import { createSubmissionLog } from '../../lib/models/submissionLog.js';
import { calculate5YearIRR, hasSufficientDataForIRR } from '../../lib/utils/irrCalculator.js';
import { Company } from '../../lib/db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      // GET /api/companies - Get only the most recent submission
      const company = await findMostRecentCompany();
      
      if (!company) {
        return res.json([]);
      }
      
      // Enrich with exit multiples and IRR calculations
      const exitMultiples = await findExitMultiplesByCompanyId(company.id!, 5);
      const exitMultiple = exitMultiples.length > 0 ? exitMultiples[0].multiple : null;
      
      let irr: number | null = null;
      if (exitMultiple && hasSufficientDataForIRR(company)) {
        irr = calculate5YearIRR(company, exitMultiple);
      }
      
      const enriched = {
        ...company,
        exit_multiple_5yr: exitMultiple,
        irr_5yr: irr,
      };
      
      return res.json([enriched]);
    }

    if (req.method === 'POST') {
      // POST /api/companies - Create or update company (upsert by ticker)
      const data = req.body;
      
      // Validate required fields
      if (!data.ticker || !data.company_name || !data.fiscal_year_end_date || !data.metric_type || !data.analyst_initials) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // Normalize ticker to uppercase
      data.ticker = data.ticker.toUpperCase();
      
      // Store exit multiple before converting (it's not a company column)
      const exitMultipleValue = data.exit_multiple_5yr;
      
      // Convert estimates arrays to fy1-fy11 format if needed
      if (Array.isArray(data.metrics)) {
        for (let i = 0; i < 11; i++) {
          data[`fy${i + 1}_metric`] = data.metrics[i] ?? null;
        }
        delete data.metrics;
      }
      
      if (Array.isArray(data.dividends)) {
        for (let i = 0; i < 11; i++) {
          data[`fy${i + 1}_div`] = data.dividends[i] ?? null;
        }
        delete data.dividends;
      }
      
      // Remove exit_multiple_5yr from data as it's not a company column
      delete data.exit_multiple_5yr;
      
      // Set default scenario if not provided
      if (!data.scenario) {
        data.scenario = 'base';
      }
      
      // Upsert company
      const company = await upsertCompanyByTicker(data as Company);
      
      // Upsert exit multiple if provided
      if (exitMultipleValue !== undefined && exitMultipleValue !== null) {
        await upsertExitMultiple({
          company_id: company.id!,
          time_horizon_years: 5,
          multiple: exitMultipleValue,
        });
      }
      
      // Create submission log entry
      await createSubmissionLog({
        company_id: company.id!,
        analyst_initials: data.analyst_initials,
        snapshot_data: JSON.stringify(company),
      });
      
      // Fetch the company again to get the latest data
      const updatedCompany = await findCompanyById(company.id!);
      if (!updatedCompany) {
        return res.status(500).json({ error: 'Failed to retrieve updated company' });
      }
      
      // Enrich with exit multiples and IRR calculations
      const exitMultiples = await findExitMultiplesByCompanyId(updatedCompany.id!, 5);
      const exitMultiple = exitMultiples.length > 0 ? exitMultiples[0].multiple : null;
      
      let irr: number | null = null;
      if (exitMultiple && hasSufficientDataForIRR(updatedCompany)) {
        irr = calculate5YearIRR(updatedCompany, exitMultiple);
      }
      
      const enriched = {
        ...updatedCompany,
        exit_multiple_5yr: exitMultiple,
        irr_5yr: irr,
      };
      
      return res.json(enriched);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in /api/companies:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

