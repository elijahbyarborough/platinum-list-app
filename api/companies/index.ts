import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../../lib/db.js';
import { findAllCompanies, upsertCompanyByTicker, findCompanyById, findCompanyByTicker } from '../../lib/models/company.js';
import { findEstimatesByCompanyId, upsertEstimates, deleteAllEstimatesForCompany } from '../../lib/models/estimates.js';
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
          // Fetch estimates for the company's ACTIVE metric type only
          const estimates = await findEstimatesByCompanyId(company.id!, company.metric_type);
          
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
      
      // Check if company already exists
      const existingCompany = await findCompanyByTicker(data.ticker);
      
      // isEdit is explicitly passed from the frontend:
      // - true when user is on /edit/:ticker page (editing an existing submission)
      // - false when user is on /submit page (new submission, even if company exists)
      const isEdit = data.isEdit === true;
      delete data.isEdit; // Remove from data before processing
      
      // For edits, get the original submission price from the snapshot (not the refreshed price)
      let originalSubmissionPrice: number | null = null;
      let originalPriceTimestamp: string | null = null;
      if (isEdit && existingCompany) {
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
      const overrideUpdatedAt = data.override_updated_at || null;
      
      // Remove non-company fields from data
      delete data.exit_multiple_5yr;
      delete data.estimates;
      delete data.override_updated_at;
      
      // Set default scenario if not provided
      if (!data.scenario) {
        data.scenario = 'base';
      }
      
      // Store old metric type before updating (for edit logic)
      const oldMetricType = existingCompany?.metric_type;
      const metricTypeChanged = isEdit && existingCompany && oldMetricType !== data.metric_type;
      
      // If editing and metric type changed, fetch old estimates before deletion for change log
      let oldEstimates: any[] = [];
      if (metricTypeChanged && oldMetricType && existingCompany?.id) {
        oldEstimates = await findEstimatesByCompanyId(existingCompany.id, oldMetricType);
      }
      
      // Upsert company
      // When editing, preserve the original submission price (locked)
      // When new submission, use the new price from the form
      const company = await upsertCompanyByTicker({
        ticker: data.ticker,
        company_name: data.company_name,
        fiscal_year_end_date: data.fiscal_year_end_date,
        metric_type: data.metric_type,
        current_stock_price: (isEdit && existingCompany)
          ? originalSubmissionPrice   // Use original submission price for edits
          : (data.current_stock_price || null),  // Use new price for new submissions
        price_last_updated: (isEdit && existingCompany)
          ? originalPriceTimestamp    // Use original timestamp for edits
          : (data.price_last_updated || null),   // Use new timestamp for new submissions
        scenario: data.scenario,
        analyst_initials: data.analyst_initials,
      });
      
      // If override_updated_at is provided (Excel imports), set the company's updated_at
      // The submission log will still show the actual submission time
      if (overrideUpdatedAt && !isEdit) {
        await sql`
          UPDATE companies
          SET updated_at = ${overrideUpdatedAt}::timestamptz
          WHERE id = ${company.id!}
        `;
        // Reload company to get the updated timestamp
        const updatedCompany = await findCompanyById(company.id!);
        if (updatedCompany) {
          Object.assign(company, updatedCompany);
        }
      }
      
      // If editing and metric type changed, delete the old metric type's estimates
      // This is because edits are corrections, not real historical data
      // The old data will still be in change_logs for tracking, but not in the estimates table
      if (metricTypeChanged && oldMetricType) {
        await deleteAllEstimatesForCompany(company.id!, oldMetricType);
      }
      
      // Upsert estimates with the company's new metric type
      // For new submissions, old estimates for other metric types remain untouched (real history)
      // For edits with metric type change, old estimates were just deleted above
      if (estimatesData.length > 0) {
        await upsertEstimates(company.id!, data.metric_type, estimatesData);
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
      // Fetch only estimates for the active metric type
      const estimates = await findEstimatesByCompanyId(company.id!, company.metric_type);
      
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
      
      if (isEdit && existingCompany) {
        // EDIT MODE: User clicked "Edit" on an existing submission
        // Get the existing log to capture the "before" state
        const existingLog = await findLatestSubmissionLogByCompanyId(company.id!);
        if (existingLog) {
          const beforeSnapshot = typeof existingLog.snapshot_data === 'string'
            ? JSON.parse(existingLog.snapshot_data)
            : existingLog.snapshot_data;
          
          // If metric type changed during edit, update the before snapshot with the old estimates
          // This ensures the change log shows what was actually in the database before deletion
          if (metricTypeChanged && oldMetricType && oldEstimates.length > 0) {
            beforeSnapshot.metric_type = oldMetricType;
            beforeSnapshot.estimates = oldEstimates;
            // Recalculate IRR with the old estimates
            const oldExitMultiple = beforeSnapshot.exit_multiple_5yr;
            if (oldExitMultiple && hasSufficientDataForIRR(beforeSnapshot, oldEstimates)) {
              beforeSnapshot.irr_5yr = calculate5YearIRR(beforeSnapshot, oldEstimates, oldExitMultiple);
            } else {
              beforeSnapshot.irr_5yr = null;
            }
          } else {
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
          }
          
          // Ensure original_submitted_at is set
          if (!beforeSnapshot.original_submitted_at) {
            beforeSnapshot.original_submitted_at = existingLog.submitted_at;
          }
          
          // Log the edit to change_logs for history tracking
          const beforeJson = JSON.stringify(beforeSnapshot);
          const afterJson = JSON.stringify(afterSnapshot);
          
          await sql`
            INSERT INTO change_logs (ticker, company_name, change_type, analyst_initials, before_snapshot, after_snapshot)
            VALUES (${company.ticker}, ${company.company_name}, 'edit', ${data.analyst_initials}, ${beforeJson}::jsonb, ${afterJson}::jsonb)
          `;
          
          // Update the existing submission log (replace with new data)
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
        // NEW SUBMISSION MODE: User submitted from /submit page
        // ALWAYS create a new submission log entry, even if company already existed
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
