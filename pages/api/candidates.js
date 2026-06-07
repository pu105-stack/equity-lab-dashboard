import fs from 'fs'
import path from 'path'

const DEC_PATH = path.join(process.cwd(), 'data', 'deep-dive-decisions.json')

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const raw = fs.readFileSync(DEC_PATH, 'utf8')
    const data = JSON.parse(raw)

    // Try to enrich with DB data (reasoning, verdict, conviction)
    let dbEnrich = {}
    try {
      const pgRes = await fetch('https://oscary.space/api/deep-dive-results')
      if (pgRes.ok) {
        const pgData = await pgRes.json()
        if (pgData.results) {
          pgData.results.forEach(r => {
            dbEnrich[r.ticker] = {
              reasoning: r.verdict ? `Fair value $${r.fair_value} | ${r.verdict}` : '',
              verdict: r.verdict || '',
              conviction: r.conviction || '',
            }
          })
        }
      }
    } catch (e) {
      // DB fail silently — 唔阻住 display
    }

    const candidates = (data.decisions || [])
      .filter(d => d.status !== 'done')
      .map(d => {
        const enrich = dbEnrich[d.ticker] || {}
        return {
          id: d.id || 0,
          ticker: d.ticker,
          screen_date: d.updated_at ? d.updated_at.slice(0, 10) : null,
          category: d.source || 'headlines',
          status: d.status || 'pending',
          reasoning: d.reasoning || enrich.reasoning || d.verdict || '',
          verdict: enrich.verdict || d.verdict || '',
          conviction: enrich.conviction || d.conviction || '',
          source_reason: d.source_reason || '',
          deep_dive_status: d.status === 'deep_dive' ? 'deep_dive' : d.status === 'skip' ? 'skip' : 'pending',
          created_at: d.updated_at,
          done_at: null,
        }
      })

    return res.json({ candidates })
  } catch (e) {
    return res.json({ candidates: [] })
  }
}
