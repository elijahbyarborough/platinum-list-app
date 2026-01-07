import { sql, parseEstimateRow, Estimate } from '../db.js';

export async function findEstimatesByCompanyId(companyId: number): Promise<Estimate[]> {
  const { rows } = await sql`
    SELECT * FROM estimates
    WHERE company_id = ${companyId}
    ORDER BY fiscal_year ASC
  `;
  return rows.map(parseEstimateRow);
}

export async function findEstimate(companyId: number, fiscalYear: number): Promise<Estimate | null> {
  const { rows } = await sql`
    SELECT * FROM estimates
    WHERE company_id = ${companyId} AND fiscal_year = ${fiscalYear}
  `;
  return rows.length > 0 ? parseEstimateRow(rows[0]) : null;
}

export async function upsertEstimate(
  companyId: number,
  fiscalYear: number,
  metricValue: number | null,
  dividendValue: number | null
): Promise<Estimate> {
  const { rows } = await sql`
    INSERT INTO estimates (company_id, fiscal_year, metric_value, dividend_value)
    VALUES (${companyId}, ${fiscalYear}, ${metricValue}, ${dividendValue})
    ON CONFLICT (company_id, fiscal_year)
    DO UPDATE SET
      metric_value = ${metricValue},
      dividend_value = ${dividendValue},
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `;
  return parseEstimateRow(rows[0]);
}

export async function upsertEstimates(
  companyId: number,
  estimates: { fiscal_year: number; metric_value: number | null; dividend_value: number | null }[]
): Promise<Estimate[]> {
  const results: Estimate[] = [];
  
  for (const est of estimates) {
    // Only upsert if there's actual data
    if (est.metric_value !== null || est.dividend_value !== null) {
      const result = await upsertEstimate(
        companyId,
        est.fiscal_year,
        est.metric_value,
        est.dividend_value
      );
      results.push(result);
    }
  }
  
  return results;
}

export async function deleteEstimate(companyId: number, fiscalYear: number): Promise<void> {
  await sql`
    DELETE FROM estimates
    WHERE company_id = ${companyId} AND fiscal_year = ${fiscalYear}
  `;
}

export async function deleteAllEstimatesForCompany(companyId: number): Promise<void> {
  await sql`
    DELETE FROM estimates WHERE company_id = ${companyId}
  `;
}

