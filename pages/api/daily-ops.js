import fs from 'fs'
import path from 'path'

export default function handler(req, res) {
  const filePath = path.join(process.cwd(), 'data', 'daily-ops.json')
  
  try {
    const data = fs.readFileSync(filePath, 'utf8')
    res.setHeader('Content-Type', 'application/json')
    res.status(200).send(data)
  } catch (e) {
    res.status(500).json({ error: 'Failed to read daily-ops.json' })
  }
}
