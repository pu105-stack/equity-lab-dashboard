import fs from 'fs'
import path from 'path'

const PORTFOLIO_PATH = path.join(process.cwd(), 'data', 'portfolio.json')

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const raw = fs.readFileSync(PORTFOLIO_PATH, 'utf8')
    const data = JSON.parse(raw)
    return res.json(data)
  } catch (e) {
    return res.json({ account: null, positions: [], error: e.message })
  }
}
