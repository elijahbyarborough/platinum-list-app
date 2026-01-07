import { sql, parseCompanyRow, Company } from '../db.js';

export async function findAllCompanies(): Promise<Company[]> {
  const { rows } = await sql`
    SELECT * FROM companies
    ORDER BY updated_at DESC
  `;
  return rows.map(parseCompanyRow);
}

export async function findMostRecentCompany(): Promise<Company | null> {
  const { rows } = await sql`
    SELECT * FROM companies
    ORDER BY updated_at DESC
    LIMIT 1
  `;
  return rows.length > 0 ? parseCompanyRow(rows[0]) : null;
}

export async function findCompanyByTicker(ticker: string): Promise<Company | null> {
  const { rows } = await sql`
    SELECT * FROM companies WHERE ticker = ${ticker}
  `;
  return rows.length > 0 ? parseCompanyRow(rows[0]) : null;
}

export async function findCompanyById(id: number): Promise<Company | null> {
  const { rows } = await sql`
    SELECT * FROM companies WHERE id = ${id}
  `;
  return rows.length > 0 ? parseCompanyRow(rows[0]) : null;
}

export async function createCompany(data: Company): Promise<Company> {
  const { rows } = await sql`
    INSERT INTO companies (
      ticker, company_name, fiscal_year_end_date, metric_type,
      current_stock_price, price_last_updated, scenario, analyst_initials,
      fy1_metric, fy2_metric, fy3_metric, fy4_metric, fy5_metric,
      fy6_metric, fy7_metric, fy8_metric, fy9_metric, fy10_metric, fy11_metric,
      fy1_div, fy2_div, fy3_div, fy4_div, fy5_div,
      fy6_div, fy7_div, fy8_div, fy9_div, fy10_div, fy11_div
    ) VALUES (
      ${data.ticker}, ${data.company_name}, ${data.fiscal_year_end_date}, ${data.metric_type},
      ${data.current_stock_price}, ${data.price_last_updated}, ${data.scenario}, ${data.analyst_initials},
      ${data.fy1_metric}, ${data.fy2_metric}, ${data.fy3_metric}, ${data.fy4_metric}, ${data.fy5_metric},
      ${data.fy6_metric}, ${data.fy7_metric}, ${data.fy8_metric}, ${data.fy9_metric}, ${data.fy10_metric}, ${data.fy11_metric},
      ${data.fy1_div}, ${data.fy2_div}, ${data.fy3_div}, ${data.fy4_div}, ${data.fy5_div},
      ${data.fy6_div}, ${data.fy7_div}, ${data.fy8_div}, ${data.fy9_div}, ${data.fy10_div}, ${data.fy11_div}
    )
    RETURNING *
  `;
  return parseCompanyRow(rows[0]);
}

export async function updateCompany(id: number, data: Partial<Company>): Promise<Company | null> {
  // Build dynamic update query
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  // List of updatable fields
  const fields = [
    'ticker', 'company_name', 'fiscal_year_end_date', 'metric_type',
    'current_stock_price', 'price_last_updated', 'scenario', 'analyst_initials',
    'fy1_metric', 'fy2_metric', 'fy3_metric', 'fy4_metric', 'fy5_metric',
    'fy6_metric', 'fy7_metric', 'fy8_metric', 'fy9_metric', 'fy10_metric', 'fy11_metric',
    'fy1_div', 'fy2_div', 'fy3_div', 'fy4_div', 'fy5_div',
    'fy6_div', 'fy7_div', 'fy8_div', 'fy9_div', 'fy10_div', 'fy11_div'
  ];

  for (const field of fields) {
    if (field in data && field !== 'id' && field !== 'created_at') {
      updates.push(`${field} = $${paramIndex}`);
      values.push((data as any)[field]);
      paramIndex++;
    }
  }

  if (updates.length === 0) {
    return findCompanyById(id);
  }

  values.push(id);
  
  // Use raw query for dynamic updates
  const query = `
    UPDATE companies
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;
  
  const { rows } = await sql.query(query, values);
  return rows.length > 0 ? parseCompanyRow(rows[0]) : null;
}

export async function upsertCompanyByTicker(data: Company): Promise<Company> {
  const existing = await findCompanyByTicker(data.ticker);
  
  if (existing) {
    const updated = await updateCompany(existing.id!, data);
    return updated!;
  } else {
    return createCompany(data);
  }
}

export async function updateCompanyPrice(ticker: string, price: number): Promise<void> {
  await sql`
    UPDATE companies
    SET current_stock_price = ${price}, price_last_updated = CURRENT_TIMESTAMP
    WHERE ticker = ${ticker}
  `;
}

