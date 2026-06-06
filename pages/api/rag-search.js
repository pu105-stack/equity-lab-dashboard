import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.PGHOST || 'host.docker.internal',
  port: parseInt(process.env.PGPORT || '5432'),
  user: process.env.PGUSER || 'tradus371',
  password: process.env.PGPASSWORD || 'QuantLab2026!',
  database: process.env.PGDATABASE || 'equity-db',
})

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { query } = req.body
  if (!query || !query.trim()) return res.status(400).json({ error: 'Missing query' })

  try {
    // Try pgvector search first (if we can generate embedding)
    let results = []
    
    // Fallback: PostgreSQL full-text search + LIKE
    const searchTerms = query.trim().split(/\s+/).filter(t => t.length > 1)
    const tsQuery = searchTerms.join(' & ')
    
    if (tsQuery) {
      const dbResult = await pool.query(`
        SELECT pipeline, date, LEFT(content, 600) AS preview
        FROM pipeline_reports
        WHERE content ILIKE '%' || $1 || '%'
           OR to_tsvector('simple', content) @@ to_tsquery('simple', $2)
        ORDER BY 
          CASE WHEN content ILIKE '%' || $1 || '%' THEN 1 ELSE 2 END,
          date DESC
        LIMIT 10
      `, [query, tsQuery])
      
      results = dbResult.rows.map((r, i) => ({
        pipeline: r.pipeline,
        date: r.date,
        score: Math.max(0, 1 - (i * 0.1)),
        preview: r.preview
      }))
    }

    return res.json({ results })
  } catch (e) {
    console.error('Search error:', e)
    return res.status(500).json({ error: e.message })
  }
}
