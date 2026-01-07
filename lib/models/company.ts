import { sql, parseCompanyRow, Company } from '../db.js';

export async function findAllCompanies(): Promise<Company[]> {
  // Only return companies that have at least one submission log entry
  const { rows } = await sql`
    SELECT DISTINCT c.*
    FROM companies c
    INNER JOIN submission_logs sl ON c.id = sl.company_id
    ORDER BY c.updated_at DESC
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

export async function createCompany(data: Omit<Company, 'id' | 'created_at' | 'updated_at'>): Promise<Company> {
  const { rows } = await sql`
    INSERT INTO companies (
      ticker, company_name, fiscal_year_end_date, metric_type,
      current_stock_price, price_last_updated, scenario, analyst_initials
    ) VALUES (
      ${data.ticker}, ${data.company_name}, ${data.fiscal_year_end_date}, ${data.metric_type},
      ${data.current_stock_price}, ${data.price_last_updated}, ${data.scenario}, ${data.analyst_initials}
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
    'current_stock_price', 'price_last_updated', 'scenario', 'analyst_initials'
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

export async function upsertCompanyByTicker(data: Omit<Company, 'id' | 'created_at' | 'updated_at'>): Promise<Company> {
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
