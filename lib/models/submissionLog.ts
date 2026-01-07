import { sql, SubmissionLog, AnalystInitials } from '../db.js';

export async function createSubmissionLog(data: {
  company_id: number;
  analyst_initials: AnalystInitials;
  snapshot_data: string;
}): Promise<SubmissionLog> {
  const { rows } = await sql`
    INSERT INTO submission_logs (company_id, analyst_initials, snapshot_data)
    VALUES (${data.company_id}, ${data.analyst_initials}, ${data.snapshot_data}::jsonb)
    RETURNING *
  `;
  return {
    ...rows[0],
    snapshot_data: typeof rows[0].snapshot_data === 'string' 
      ? rows[0].snapshot_data 
      : JSON.stringify(rows[0].snapshot_data)
  };
}

export async function findSubmissionLogsByCompanyId(companyId: number): Promise<SubmissionLog[]> {
  const { rows } = await sql`
    SELECT * FROM submission_logs
    WHERE company_id = ${companyId}
    ORDER BY submitted_at DESC
  `;
  return rows.map(row => ({
    ...row,
    snapshot_data: typeof row.snapshot_data === 'string' 
      ? row.snapshot_data 
      : JSON.stringify(row.snapshot_data)
  }));
}

export async function findLatestSubmissionLogByCompanyId(companyId: number): Promise<SubmissionLog | null> {
  const { rows } = await sql`
    SELECT * FROM submission_logs
    WHERE company_id = ${companyId}
    ORDER BY submitted_at DESC
    LIMIT 1
  `;
  if (rows.length === 0) return null;
  return {
    ...rows[0],
    snapshot_data: typeof rows[0].snapshot_data === 'string' 
      ? rows[0].snapshot_data 
      : JSON.stringify(rows[0].snapshot_data)
  };
}

export async function findAllSubmissionLogs(): Promise<SubmissionLog[]> {
  const { rows } = await sql`
    SELECT * FROM submission_logs
    ORDER BY submitted_at DESC
  `;
  return rows.map(row => ({
    ...row,
    snapshot_data: typeof row.snapshot_data === 'string' 
      ? row.snapshot_data 
      : JSON.stringify(row.snapshot_data)
  }));
}

