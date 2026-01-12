import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../../lib/db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      // GET /api/dashboard-snapshots - Get all snapshots
      const { rows } = await sql`
        SELECT id, snapshot_date, pdf_url, created_at
        FROM dashboard_snapshots
        ORDER BY snapshot_date DESC
      `;
      
      return res.json(rows);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Error in /api/dashboard-snapshots:', error);
    const errorMessage = error?.message || error?.detail || 'Internal server error';
    return res.status(500).json({ error: errorMessage });
  }
}

