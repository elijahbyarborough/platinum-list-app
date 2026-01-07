import { db } from '../database/connection.js';
import { ExitMultiple } from './types.js';

export class ExitMultipleModel {
  static findByCompanyId(companyId: number, timeHorizon?: number): ExitMultiple[] {
    if (timeHorizon !== undefined) {
      const stmt = db.prepare(`
        SELECT * FROM exit_multiples
        WHERE company_id = ? AND time_horizon_years = ?
      `);
      const result = stmt.get(companyId, timeHorizon) as ExitMultiple | undefined;
      return result ? [result] : [];
    }

    const stmt = db.prepare(`
      SELECT * FROM exit_multiples
      WHERE company_id = ?
      ORDER BY time_horizon_years
    `);
    return stmt.all(companyId) as ExitMultiple[];
  }

  static upsert(data: ExitMultiple): ExitMultiple {
    const existing = db.prepare(`
      SELECT * FROM exit_multiples
      WHERE company_id = ? AND time_horizon_years = ?
    `).get(data.company_id, data.time_horizon_years) as ExitMultiple | undefined;

    if (existing) {
      const stmt = db.prepare(`
        UPDATE exit_multiples
        SET multiple = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      stmt.run(data.multiple, existing.id);
      return { ...existing, multiple: data.multiple };
    } else {
      const stmt = db.prepare(`
        INSERT INTO exit_multiples (company_id, time_horizon_years, multiple)
        VALUES (?, ?, ?)
      `);
      const result = stmt.run(data.company_id, data.time_horizon_years, data.multiple);
      return { ...data, id: Number(result.lastInsertRowid) };
    }
  }

  static deleteByCompanyId(companyId: number): void {
    const stmt = db.prepare('DELETE FROM exit_multiples WHERE company_id = ?');
    stmt.run(companyId);
  }
}

