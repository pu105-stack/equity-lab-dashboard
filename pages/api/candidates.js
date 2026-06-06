import fs from 'fs'
import path from 'path'

const DEC_PATH = path.join(process.cwd(), 'data', 'deep-dive-decisions.json')

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const raw = fs.readFileSync(DEC_PATH, 'utf8')
    const data = JSON.parse(raw)
    
    const candidates = (data.decisions || [])
      .filter(d => d.status !== 'done')
      .map(d => ({
        id: d.id || 0,
        ticker: d.ticker,
        screen_date: d.updated_at ? d.updated_at.slice(0, 10) : null,
        category: d.source || 'headlines',
        status: d.status || 'pending',
        reasoning: d.reasoning || d.verdict || '',
        deep_dive_status: d.status === 'deep_dive' ? 'deep_dive' : d.status === 'skip' ? 'skip' : 'pending',
        created_at: d.updated_at,
        done_at: null,
      }))

    return res.json({ candidates })
  } catch (e) {
    return res.json({ candidates: [] })
  }
}
