import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../../lib/db.js';
import { findAllCompanies, upsertCompanyByTicker, findCompanyById, findCompanyByTicker } from '../../lib/models/company.js';
import { findEstimatesByCompanyId, upsertEstimates } from '../../lib/models/estimates.js';
import { findExitMultiplesByCompanyId, upsertExitMultiple } from '../../lib/models/exitMultiple.js';
import { createSubmissionLog, findLatestSubmissionLogByCompanyId, updateSubmissionLog } from '../../lib/models/submissionLog.js';
import { calculate5YearIRR, hasSufficientDataForIRR } from '../../lib/utils/irrCalculator.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      // GET /api/companies - Get all companies with estimates and IRR
      const companies = await findAllCompanies();
      
      if (companies.length === 0) {
        return res.json([]);
      }
      
      // Enrich each company with estimates, exit multiples, and IRR
      const enrichedCompanies = await Promise.all(
        companies.map(async (company) => {
          // Fetch estimates for the company
          const estimates = await findEstimatesByCompanyId(company.id!);
          
          // Fetch exit multiples
          const exitMultiples = await findExitMultiplesByCompanyId(company.id!, 5);
          const exitMultiple = exitMultiples.length > 0 ? exitMultiples[0].multiple : null;
          
          // Calculate IRR if we have sufficient data
          let irr: number | null = null;
          if (exitMultiple && hasSufficientDataForIRR(company, estimates)) {
            irr = calculate5YearIRR(company, estimates, exitMultiple);
          }
          
          return {
            ...company,
            estimates,
            exit_multiple_5yr: exitMultiple,
            irr_5yr: irr,
          };
        })
      );
      
      return res.json(enrichedCompanies);
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
      
      // Check if company already exists (this is an edit, not a new submission)
      const existingCompany = await findCompanyByTicker(data.ticker);
      const isEdit = !!existingCompany;
      
      // For edits, get the original submission price from the snapshot (not the refreshed price)
      let originalSubmissionPrice: number | null = null;
      let originalPriceTimestamp: string | null = null;
      if (isEdit) {
        const existingLog = await findLatestSubmissionLogByCompanyId(existingCompany.id!);
        if (existingLog) {
          const snapshot = typeof existingLog.snapshot_data === 'string'
            ? JSON.parse(existingLog.snapshot_data)
            : existingLog.snapshot_data;
          originalSubmissionPrice = snapshot.current_stock_price ?? null;
          originalPriceTimestamp = snapshot.price_last_updated ?? null;
        }
      }
      
      // Store exit multiple and estimates before processing
      const exitMultipleValue = data.exit_multiple_5yr;
      const estimatesData = data.estimates || [];
      
      // Remove non-company fields from data
      delete data.exit_multiple_5yr;
      delete data.estimates;
      
      // Set default scenario if not provided
      if (!data.scenario) {
        data.scenario = 'base';
      }
      
      // Upsert company
      // When editing, preserve the original submission price (locked)
      const company = await upsertCompanyByTicker({
        ticker: data.ticker,
        company_name: data.company_name,
        fiscal_year_end_date: data.fiscal_year_end_date,
        metric_type: data.metric_type,
        current_stock_price: isEdit 
          ? originalSubmissionPrice   // Use original submission price
          : (data.current_stock_price || null),  // Use new price for new submissions
        price_last_updated: isEdit
          ? originalPriceTimestamp    // Use original timestamp
          : (data.price_last_updated || null),   // Use new timestamp for new submissions
        scenario: data.scenario,
        analyst_initials: data.analyst_initials,
      });
      
      // Upsert estimates
      if (estimatesData.length > 0) {
        await upsertEstimates(company.id!, estimatesData);
      }
      
      // Upsert exit multiple if provided
      if (exitMultipleValue !== undefined && exitMultipleValue !== null) {
        await upsertExitMultiple({
          company_id: company.id!,
          time_horizon_years: 5,
          multiple: exitMultipleValue,
        });
      }
      
      // Create or update submission log entry
      const estimates = await findEstimatesByCompanyId(company.id!);
      
      // Get exit multiple for the snapshot
      const exitMultiplesForSnapshot = await findExitMultiplesByCompanyId(company.id!, 5);
      const exitMultipleForSnapshot = exitMultiplesForSnapshot.length > 0 ? exitMultiplesForSnapshot[0].multiple : null;
      
      // Calculate IRR for the after state
      let afterIRR: number | null = null;
      if (exitMultipleForSnapshot && hasSufficientDataForIRR(company, estimates)) {
        afterIRR = calculate5YearIRR(company, estimates, exitMultipleForSnapshot);
      }
      
      const afterSnapshot = { 
        ...company, 
        estimates,
        exit_multiple_5yr: exitMultipleForSnapshot,
        irr_5yr: afterIRR
      };
      const snapshotData = JSON.stringify(afterSnapshot);
      
      if (isEdit) {
        // Get the existing log to capture the "before" state
        const existingLog = await findLatestSubmissionLogByCompanyId(company.id!);
        if (existingLog) {
          const beforeSnapshot = typeof existingLog.snapshot_data === 'string'
            ? JSON.parse(existingLog.snapshot_data)
            : existingLog.snapshot_data;
          
          // Add the original submission timestamp to the before snapshot
          beforeSnapshot.original_submitted_at = existingLog.submitted_at;
          
          // Calculate IRR for the before state if not already present
          if (beforeSnapshot.irr_5yr === undefined) {
            const beforeEstimates = beforeSnapshot.estimates || [];
            const beforeExitMultiple = beforeSnapshot.exit_multiple_5yr;
            if (beforeExitMultiple && hasSufficientDataForIRR(beforeSnapshot, beforeEstimates)) {
              beforeSnapshot.irr_5yr = calculate5YearIRR(beforeSnapshot, beforeEstimates, beforeExitMultiple);
            } else {
              beforeSnapshot.irr_5yr = null;
            }
          }
          
          // Log the edit to change_logs for history tracking
          const beforeJson = JSON.stringify(beforeSnapshot);
          const afterJson = JSON.stringify(afterSnapshot);
          
          await sql`
            INSERT INTO change_logs (ticker, company_name, change_type, analyst_initials, before_snapshot, after_snapshot)
            VALUES (${company.ticker}, ${company.company_name}, 'edit', ${data.analyst_initials}, ${beforeJson}::jsonb, ${afterJson}::jsonb)
          `;
          
          // Update the existing submission log
          await updateSubmissionLog(existingLog.id!, {
            analyst_initials: data.analyst_initials,
            snapshot_data: snapshotData,
          });
        } else {
          // No existing log found (shouldn't happen, but create one just in case)
          await createSubmissionLog({
            company_id: company.id!,
            analyst_initials: data.analyst_initials,
            snapshot_data: snapshotData,
          });
        }
      } else {
        // New company - create a new submission log
        await createSubmissionLog({
          company_id: company.id!,
          analyst_initials: data.analyst_initials,
          snapshot_data: snapshotData,
        });
      }
      
      // Fetch the company again to get the latest data
      const updatedCompany = await findCompanyById(company.id!);
      if (!updatedCompany) {
        return res.status(500).json({ error: 'Failed to retrieve updated company' });
      }
      
      // Fetch exit multiples
      const exitMultiples = await findExitMultiplesByCompanyId(updatedCompany.id!, 5);
      const exitMultiple = exitMultiples.length > 0 ? exitMultiples[0].multiple : null;
      
      // Calculate IRR
      let irr: number | null = null;
      if (exitMultiple && hasSufficientDataForIRR(updatedCompany, estimates)) {
        irr = calculate5YearIRR(updatedCompany, estimates, exitMultiple);
      }
      
      const enriched = {
        ...updatedCompany,
        estimates,
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
