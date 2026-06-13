import fs from 'fs'
import path from 'path'

const PORTFOLIO_PATH = path.join(process.cwd(), 'data', 'portfolio.json')
const FMP_KEY = 'g5dmYXPnB8B2LMFCcvqT0sUNlK9QsGve'
const FMP_QUOTE = (ticker) => `https://financialmodelingprep.com/stable/quote?symbol=${ticker}&apikey=${FMP_KEY}`

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    // Read synced portfolio data
    const raw = fs.readFileSync(PORTFOLIO_PATH, 'utf8')
    const data = JSON.parse(raw)
    const { account, positions } = data

    if (positions.length === 0) {
      return res.json({ account, positions: [], last_synced: data.last_synced })
    }

    // Fetch live prices from FMP
    const tickers = positions.map(p => p.ticker)
    const livePrices = {}

    for (const ticker of tickers) {
      try {
        const resp = await fetch(FMP_QUOTE(ticker))
        const json = await resp.json()
        if (Array.isArray(json) && json.length > 0) {
          livePrices[ticker] = json[0].price || null
        }
      } catch { /* fallback: live price stays null */ }
    }

    // Enrich positions with live prices
    const enriched = positions.map(p => {
      const live = livePrices[p.ticker]
      const costBasis = p.entry_price * p.quantity
      const marketValue = live ? live * p.quantity : null
      const pnl = live ? marketValue - costBasis : null
      const pnlPct = live ? (pnl / costBasis) * 100 : null

      return {
        ...p,
        live_price: live,
        market_value: marketValue ? Math.round(marketValue * 100) / 100 : null,
        pnl: pnl ? Math.round(pnl * 100) / 100 : null,
        pnl_pct: pnlPct ? Math.round(pnlPct * 100) / 100 : null,
      }
    })

    // Update account with live P&L from positions
    const totalPnl = enriched.reduce((sum, p) => sum + (p.pnl || 0), 0)
    const liveEquity = account.cash + enriched.reduce((sum, p) => sum + (p.market_value || 0), 0)
    const livePnl = liveEquity - account.initial
    const livePnlPct = account.initial > 0 ? (livePnl / account.initial) * 100 : 0

    const liveAccount = {
      ...account,
      equity: Math.round(liveEquity * 100) / 100,
      pnl: Math.round(livePnl * 100) / 100,
      pnl_pct: Math.round(livePnlPct * 100) / 100,
    }

    return res.json({
      account: liveAccount,
      positions: enriched,
      last_synced: data.last_synced,
    })
  } catch (e) {
    return res.json({ account: null, positions: [], error: e.message })
  }
}
