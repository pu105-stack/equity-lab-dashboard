import fs from 'fs'
import path from 'path'

const RES_PATH = '/tmp/deep-dive-results.json'
const DEFAULT = { results: [] }

export default function handler(req, res) {
  // GET: return all results
  if (req.method === 'GET') {
    try {
      const data = JSON.parse(fs.readFileSync(RES_PATH, 'utf8'))
      return res.json(data)
    } catch {
      return res.json(DEFAULT)
    }
  }

  // POST: add/update a result (called by Maya after deep dive)
  if (req.method === 'POST') {
    const { ticker, result } = req.body
    if (!ticker || !result) return res.status(400).json({ error: 'Missing ticker or result' })

    let data = DEFAULT
    try { data = JSON.parse(fs.readFileSync(RES_PATH, 'utf8')) } catch {}

    // Remove existing entry for this ticker if exists
    data.results = data.results.filter(r => r.ticker !== ticker)
    
    // Add new result
    data.results.push({
      ticker,
      ...result,
      completed_at: result.completed_at || new Date().toISOString(),
    })

    fs.writeFileSync(RES_PATH, JSON.stringify(data, null, 2))
    return res.json({ ok: true, count: data.results.length })
  }

  // DELETE: archive a result (keep things clean)
  if (req.method === 'DELETE') {
    const { ticker } = req.body
    let data = DEFAULT
    try { data = JSON.parse(fs.readFileSync(RES_PATH, 'utf8')) } catch {}
    
    data.results = data.results.filter(r => r.ticker !== ticker)
    fs.writeFileSync(RES_PATH, JSON.stringify(data, null, 2))
    return res.json({ ok: true, removed: ticker })
  }

  res.status(405).json({ error: 'Method not allowed' })
}
