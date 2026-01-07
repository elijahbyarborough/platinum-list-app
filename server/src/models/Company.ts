import { db } from '../database/connection.js';
import { Company } from './types.js';

export class CompanyModel {
  static findAll(): Company[] {
    const stmt = db.prepare(`
      SELECT * FROM companies
      ORDER BY updated_at DESC
    `);
    return stmt.all() as Company[];
  }

  static findByTicker(ticker: string): Company | null {
    const stmt = db.prepare('SELECT * FROM companies WHERE ticker = ?');
    const result = stmt.get(ticker) as Company | undefined;
    return result || null;
  }

  static create(data: Company): Company {
    const stmt = db.prepare(`
      INSERT INTO companies (
        ticker, company_name, fiscal_year_end_date, metric_type,
        current_stock_price, price_last_updated, scenario, analyst_initials,
        fy1_metric, fy2_metric, fy3_metric, fy4_metric, fy5_metric,
        fy6_metric, fy7_metric, fy8_metric, fy9_metric, fy10_metric, fy11_metric,
        fy1_div, fy2_div, fy3_div, fy4_div, fy5_div,
        fy6_div, fy7_div, fy8_div, fy9_div, fy10_div, fy11_div
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `);

    const result = stmt.run(
      data.ticker,
      data.company_name,
      data.fiscal_year_end_date,
      data.metric_type,
      data.current_stock_price,
      data.price_last_updated,
      data.scenario,
      data.analyst_initials,
      data.fy1_metric,
      data.fy2_metric,
      data.fy3_metric,
      data.fy4_metric,
      data.fy5_metric,
      data.fy6_metric,
      data.fy7_metric,
      data.fy8_metric,
      data.fy9_metric,
      data.fy10_metric,
      data.fy11_metric,
      data.fy1_div,
      data.fy2_div,
      data.fy3_div,
      data.fy4_div,
      data.fy5_div,
      data.fy6_div,
      data.fy7_div,
      data.fy8_div,
      data.fy9_div,
      data.fy10_div,
      data.fy11_div
    );

    return { ...data, id: Number(result.lastInsertRowid) };
  }

  static update(id: number, data: Partial<Company>): Company | null {
    const existing = db.prepare('SELECT * FROM companies WHERE id = ?').get(id) as Company | undefined;
    if (!existing) return null;

    const updates: string[] = [];
    const values: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'created_at' && value !== undefined) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (updates.length === 0) return existing;

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = db.prepare(`
      UPDATE companies
      SET ${updates.join(', ')}
      WHERE id = ?
    `);

    stmt.run(...values);

    return this.findById(id);
  }

  static findById(id: number): Company | null {
    const stmt = db.prepare('SELECT * FROM companies WHERE id = ?');
    const result = stmt.get(id) as Company | undefined;
    return result || null;
  }

  static upsertByTicker(data: Company): Company {
    const existing = this.findByTicker(data.ticker);
    
    if (existing) {
      const updated = this.update(existing.id!, data);
      return updated!;
    } else {
      return this.create(data);
    }
  }

  static updatePrice(ticker: string, price: number): void {
    const stmt = db.prepare(`
      UPDATE companies
      SET current_stock_price = ?, price_last_updated = CURRENT_TIMESTAMP
      WHERE ticker = ?
    `);
    stmt.run(price, ticker);
  }
}

