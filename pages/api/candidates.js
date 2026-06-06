import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.PGHOST || 'host.docker.internal',
  port: parseInt(process.env.PGPORT || '5432'),
  user: process.env.PGUSER || 'tradus371',
  password: process.env.PGPASSWORD || 'QuantLab2026!',
  database: process.env.PGDATABASE || 'equity-db',
})

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const result = await pool.query(`
      SELECT id, screen_date, ticker, category, deep_dive_status, reasoning,
             created_at, done_at
      FROM weekly_screen
      WHERE deep_dive_status IS DISTINCT FROM 'done'
        AND deep_dive_status IS DISTINCT FROM 'skip'
      ORDER BY screen_date DESC, id
    `)

    return res.json({
      candidates: result.rows.map(r => ({
        id: r.id,
        ticker: r.ticker,
        screen_date: r.screen_date,
        category: r.category,
        status: r.deep_dive_status || 'pending',
        reasoning: r.reasoning,
        created_at: r.created_at,
        done_at: r.done_at,
      }))
    })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
