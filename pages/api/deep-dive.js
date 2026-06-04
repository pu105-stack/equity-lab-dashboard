export default function handler(req, res) {
  // GET: 讀取 decisions
  if (req.method === 'GET') {
    const fs = require('fs')
    const path = require('path')
    const decPath = path.join(process.cwd(), 'data', 'deep-dive-decisions.json')
    const opsPath = path.join(process.cwd(), 'data', 'daily-ops.json')
    
    // 讀 decisions
    let decisions = []
    try {
      decisions = JSON.parse(fs.readFileSync(decPath, 'utf8')).decisions || []
    } catch {}

    return res.json({ decisions })
  }

  // POST: 儲存 decisions
  if (req.method === 'POST') {
    const { decisions } = req.body
    if (!decisions) return res.status(400).json({ error: 'Missing decisions' })

    const fs = require('fs')
    const path = require('path')
    const decPath = path.join(process.cwd(), 'data', 'deep-dive-decisions.json')
    
    // 寫入本地 file (for local dev / build)
    const payload = {
      decisions,
      last_updated: new Date().toISOString()
    }
    try {
      fs.writeFileSync(decPath, JSON.stringify(payload, null, 2))
      
      // Try to git commit + push (works on local machine)
      try {
        const { execSync } = require('child_process')
        execSync('git add data/deep-dive-decisions.json', { cwd: process.cwd(), timeout: 10000 })
        execSync('git commit -m "deep-dive: update decisions" --allow-empty', { cwd: process.cwd(), timeout: 10000 })
        execSync('git push', { cwd: process.cwd(), timeout: 30000 })
      } catch (gitErr) {
        console.log('Git push failed (expected on Vercel):', gitErr.message)
      }
      
      return res.json({ ok: true, count: decisions.length })
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  }

  res.status(405).json({ error: 'Method not allowed' })
}
