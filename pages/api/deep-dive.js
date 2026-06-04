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
    const { decisions } = req.body
    if (!decisions) return res.status(400).json({ error: 'Missing decisions' })

    const payload = {
      decisions,
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
