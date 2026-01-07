import { db } from '../database/connection.js';
import { SubmissionLog } from './types.js';

export class SubmissionLogModel {
  static create(data: SubmissionLog): SubmissionLog {
    const stmt = db.prepare(`
      INSERT INTO submission_logs (company_id, analyst_initials, snapshot_data)
      VALUES (?, ?, ?)
    `);
    const result = stmt.run(data.company_id, data.analyst_initials, data.snapshot_data);
    return { ...data, id: Number(result.lastInsertRowid) };
  }

  static findByCompanyId(companyId: number): SubmissionLog[] {
    const stmt = db.prepare(`
      SELECT * FROM submission_logs
      WHERE company_id = ?
      ORDER BY submitted_at DESC
    `);
    return stmt.all(companyId) as SubmissionLog[];
  }

  static findLatestByCompanyId(companyId: number): SubmissionLog | null {
    const stmt = db.prepare(`
      SELECT * FROM submission_logs
      WHERE company_id = ?
      ORDER BY submitted_at DESC
      LIMIT 1
    `);
    const result = stmt.get(companyId) as SubmissionLog | undefined;
    return result || null;
  }

  static findAll(): SubmissionLog[] {
    const stmt = db.prepare(`
      SELECT * FROM submission_logs
      ORDER BY submitted_at DESC
    `);
    return stmt.all() as SubmissionLog[];
  }
}

