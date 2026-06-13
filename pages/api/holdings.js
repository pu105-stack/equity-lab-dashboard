import fs from 'fs'
import path from 'path'

const PORTFOLIO_PATH = path.join(process.cwd(), 'data', 'portfolio.json')
const YAHOO_CHART = (ticker) => `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    // Read synced portfolio data
    const raw = fs.readFileSync(PORTFOLIO_PATH, 'utf8')
    const data = JSON.parse(raw)
    let { account, positions } = data

    // Fetch live prices from Yahoo Finance (free, no API key)
    if (positions.length > 0) {
      const enriched = []
      for (const p of positions) {
        let livePrice = null
        try {
          const resp = await fetch(YAHOO_CHART(p.ticker))
          const json = await resp.json()
          const result = json?.chart?.result?.[0]
          if (result) {
            const quotes = result.indicators?.quote?.[0]
            const closes = quotes?.close || []
            const valid = closes.filter(c => c !== null)
            if (valid.length > 0) livePrice = Math.round(valid[valid.length - 1] * 100) / 100
          }
        } catch { /* fallback: use synced price */ }

        const costBasis = p.entry_price * p.quantity
        const marketValue = livePrice ? livePrice * p.quantity : (p.market_value || null)
        const pnl = livePrice ? marketValue - costBasis : (p.pnl || null)
        const pnlPct = livePrice && costBasis > 0 ? Math.round((pnl / costBasis) * 10000) / 100 : (p.pnl_pct || null)

        enriched.push({
          ...p,
          live_price: livePrice || p.live_price,
          market_value: marketValue ? Math.round(marketValue * 100) / 100 : null,
          pnl: pnl ? Math.round(pnl * 100) / 100 : null,
          pnl_pct: pnlPct,
        })
      }
      positions = enriched

      // Recalculate account
      const totalMv = positions.reduce((s, p) => s + (p.market_value || 0), 0)
      const liveEquity = account.cash + totalMv
      const livePnl = liveEquity - account.initial
      const livePnlPct = account.initial > 0 ? Math.round((livePnl / account.initial) * 10000) / 100 : 0
      account = { ...account, equity: Math.round(liveEquity * 100) / 100, pnl: Math.round(livePnl * 100) / 100, pnl_pct: livePnlPct }
    }

    return res.json({ account, positions, last_synced: data.last_synced })
  } catch (e) {
    return res.json({ account: null, positions: [], error: e.message })
  }
}
