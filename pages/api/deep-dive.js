import fs from 'fs'
import path from 'path'

const DEC_PATH = '/tmp/deep-dive-decisions.json'

export default function handler(req, res) {
  // GET: 返回 decisions（我 browser 睇到）
  if (req.method === 'GET') {
    try {
      const data = JSON.parse(fs.readFileSync(DEC_PATH, 'utf8'))
      return res.json(data)
    } catch {
      return res.json({ decisions: [], last_updated: null })
    }
  }

  // POST: 儲存 decisions（你㩒 Sync 時）
  if (req.method === 'POST') {
    const { decisions, merge } = req.body
    if (!decisions) return res.status(400).json({ error: 'Missing decisions' })

    let allDecisions = decisions
    
    // merge mode: keep existing decisions, only update the ones in this request
    if (merge) {
      try {
        const existing = JSON.parse(fs.readFileSync(DEC_PATH, 'utf8'))
        const existingMap = {}
        existing.decisions.forEach(d => { existingMap[d.ticker] = d })
        decisions.forEach(d => { existingMap[d.ticker] = d })
        allDecisions = Object.values(existingMap)
      } catch {}
    }

    const payload = {
      decisions: allDecisions,
      last_updated: new Date().toISOString()
    }
    
    try {
      fs.writeFileSync(DEC_PATH, JSON.stringify(payload, null, 2))
      return res.json({ ok: true, count: decisions.length, path: DEC_PATH })
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  }

  res.status(405).json({ error: 'Method not allowed' })
}
