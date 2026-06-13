import { useState, useEffect } from 'react'

const PNL_COLOR = (v) => v > 0 ? '#10b981' : v < 0 ? '#ef4444' : '#94a3b8'

export default function PortfolioPage() {
  const [account, setAccount] = useState(null)
  const [positions, setPositions] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState({})
  const [lastUpdated, setLastUpdated] = useState(null)

  const load = async () => {
    try {
      const resp = await fetch('/api/holdings')
      const data = await resp.json()
      setAccount(data.account)
      setPositions(data.positions || [])
      setLastUpdated(new Date().toLocaleTimeString('zh-HK', { hour12: false }))
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // Auto-refresh every 60s
  useEffect(() => {
    const interval = setInterval(load, 60000)
    return () => clearInterval(interval)
  }, [])

  const toggle = (ticker) => setOpen(p => ({ ...p, [ticker]: !p[ticker] }))

  const totalMarketValue = positions.reduce((s, p) => s + (p.market_value || 0), 0)
  const totalPnl = positions.reduce((s, p) => s + (p.pnl || 0), 0)

  if (loading) return (
    <div className="container">
      <div className="header"><h1>📊 Portfolio</h1></div>
      <p style={{ color: '#64748b' }}>Loading...</p>
    </div>
  )

  return (
    <div className="container">
      <div className="header">
        <h1>📊 Portfolio</h1>
        <div className="date">Anya 嘅持倉 · {lastUpdated ? `Updated ${lastUpdated}` : ''}</div>
      </div>

      {/* Account Summary */}
      {account && (
        <div className="summary">
          <div className="stat"><span className="n">{formatUSD(account.equity)}</span><span className="l">💰 Equity</span></div>
          <div className="stat"><span className="n">{formatUSD(account.cash)}</span><span className="l">💵 Cash</span></div>
          <div className="stat"><span className="n" style={{ color: PNL_COLOR(account.pnl) }}>{account.pnl >= 0 ? '+' : ''}{formatUSD(account.pnl)}</span><span className="l">📈 P&L</span></div>
          <div className="stat"><span className="n" style={{ color: PNL_COLOR(account.pnl_pct) }}>{account.pnl_pct >= 0 ? '+' : ''}{account.pnl_pct.toFixed(2)}%</span><span className="l">📊 P&L %</span></div>
        </div>
      )}

      {/* Holdings */}
      {positions.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">✨</div>
          <div>No open positions</div>
          <div className="empty-sub">Anya 未有持倉</div>
        </div>
      ) : (
        <div className="tl">
          {/* Table Header */}
          <div className="tbl-hd">
            <span className="col-tkr">Ticker</span>
            <span className="col-dir">Dir</span>
            <span className="col-num">Qty</span>
            <span className="col-num">Entry</span>
            <span className="col-num">Live</span>
            <span className="col-num">Mkt Val</span>
            <span className="col-num">P&L $</span>
            <span className="col-num">P&L %</span>
            <span className="col-dd">DD</span>
            <span className="col-expand"></span>
          </div>

          {positions.map(p => {
            const isOpen = !!open[p.ticker]
            const pnlColor = PNL_COLOR(p.pnl)
            const pnlPctColor = PNL_COLOR(p.pnl_pct)

            return (
              <div key={p.ticker} className="card">
                {/* Row */}
                <div className="row" onClick={() => toggle(p.ticker)}>
                  <span className="col-tkr tkr">{p.ticker}</span>
                  <span className="col-dir" style={{ color: p.direction === 'LONG' ? '#10b981' : '#ef4444' }}>{p.direction}</span>
                  <span className="col-num">{p.quantity}</span>
                  <span className="col-num">{formatUSD(p.entry_price)}</span>
                  <span className="col-num">{p.live_price ? formatUSD(p.live_price) : '—'}</span>
                  <span className="col-num">{p.market_value ? formatUSD(p.market_value) : '—'}</span>
                  <span className="col-num" style={{ color: pnlColor }}>{p.pnl != null ? `${p.pnl >= 0 ? '+' : ''}${formatUSD(p.pnl)}` : '—'}</span>
                  <span className="col-num" style={{ color: pnlPctColor }}>{p.pnl_pct != null ? `${p.pnl_pct >= 0 ? '+' : ''}${p.pnl_pct.toFixed(2)}%` : '—'}</span>
                  <span className="col-dd">{p.dd_decision ? <span className={`dd-badge dd-${(p.dd_decision || '').toLowerCase()}`}>{p.dd_decision}</span> : '—'}</span>
                  <span className={`arrow ${isOpen ? 'open' : ''}`}>▼</span>
                </div>

                {/* Detail (expand) */}
                {isOpen && (
                  <div className="bd">
                    <div className="metrics">
                      <div className="metric"><span className="ml">SL</span><span className="mv" style={{ color: '#ef4444' }}>{formatUSD(p.stop_loss)}</span></div>
                      <div className="metric"><span className="ml">TP</span><span className="mv" style={{ color: '#10b981' }}>{formatUSD(p.take_profit)}</span></div>
                      <div className="metric"><span className="ml">Opened</span><span className="mv">{p.opened_at?.slice(0, 10) || '—'}</span></div>
                      <div className="metric"><span className="ml">F.V.</span><span className="mv">{p.dd_fair_value ? formatUSD(p.dd_fair_value) : '—'}</span></div>
                      <div className="metric"><span className="ml">Upside</span><span className="mv" style={{ color: '#10b981' }}>{p.dd_upside_pct ? `+${p.dd_upside_pct.toFixed(1)}%` : '—'}</span></div>
                      <div className="metric"><span className="ml">Conviction</span><span className="mv">{p.dd_conviction || '—'}</span></div>
                    </div>

                    {/* SL/TP Progress Bars */}
                    <div className="progress-section">
                      <div className="progress-row">
                        <span className="progress-label">To SL: {p.stop_loss > 0 && p.entry_price > 0 && p.live_price
                          ? `${Math.abs(((p.live_price - p.entry_price) / (p.stop_loss - p.entry_price)) * 100).toFixed(0)}%`
                          : '—'}
                        </span>
                        <div className="progress-bar">
                          <div className="progress-fill sl" style={{ width: p.stop_loss > 0 && p.entry_price > 0 && p.live_price
                            ? `${Math.min(Math.abs(((p.live_price - p.entry_price) / (p.stop_loss - p.entry_price)) * 100), 100)}%`
                            : '0%' }}></div>
                        </div>
                      </div>
                      <div className="progress-row">
                        <span className="progress-label">To TP: {p.take_profit > 0 && p.entry_price > 0 && p.live_price
                          ? `${Math.abs(((p.live_price - p.entry_price) / (p.take_profit - p.entry_price)) * 100).toFixed(0)}%`
                          : '—'}
                        </span>
                        <div className="progress-bar">
                          <div className="progress-fill tp" style={{ width: p.take_profit > 0 && p.entry_price > 0 && p.live_price
                            ? `${Math.min(Math.abs(((p.live_price - p.entry_price) / (p.take_profit - p.entry_price)) * 100), 100)}%`
                            : '0%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {/* Total Row */}
          <div className="total-row">
            <span className="col-tkr">Total</span>
            <span className="col-dir"></span>
            <span className="col-num">{positions.reduce((s, p) => s + p.quantity, 0)}</span>
            <span className="col-num"></span>
            <span className="col-num"></span>
            <span className="col-num">{formatUSD(totalMarketValue)}</span>
            <span className="col-num" style={{ color: PNL_COLOR(totalPnl) }}>{totalPnl >= 0 ? '+' : ''}{formatUSD(totalPnl)}</span>
            <span className="col-num"></span>
            <span className="col-dd"></span>
            <span className="col-expand"></span>
          </div>
        </div>
      )}

      {positions.length > 0 && (
        <div className="footer">
          <span>🔹 Live prices refresh every 60s · {lastUpdated && `Last updated ${lastUpdated}`}</span>
          <button className="refresh-btn" onClick={load}>🔄 Refresh</button>
        </div>
      )}

      <style jsx>{`
        .summary { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
        .stat { background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 12px 16px; display: flex; flex-direction: column; align-items: center; min-width: 72px; flex: 1; }
        .stat .n { font-size: 20px; font-weight: 700; color: #f1f5f9; }
        .stat .l { font-size: 12px; color: #94a3b8; margin-top: 3px; }

        .tl { display: flex; flex-direction: column; gap: 4px; margin-bottom: 20px; }
        .tbl-hd { display: flex; gap: 6px; padding: 8px 14px; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
        .card { background: #1e293b; border: 1px solid #334155; border-radius: 10px; overflow: hidden; }
        .row { display: flex; align-items: center; gap: 6px; padding: 12px 14px; cursor: pointer; min-height: 48px; }
        .row:hover { background: rgba(255,255,255,0.02); }

        .col-tkr { flex: 0 0 60px; }
        .col-dir { flex: 0 0 42px; font-size: 11px; font-weight: 600; }
        .col-num { flex: 1; min-width: 50px; text-align: right; font-size: 14px; font-weight: 500; color: #e2e8f0; }
        .col-dd { flex: 0 0 52px; text-align: center; }
        .col-expand { flex: 0 0 20px; }

        .tkr { font-size: 15px; font-weight: 700; font-family: monospace; color: #f1f5f9; }
        .arrow { font-size: 11px; color: #64748b; transition: transform 0.2s; }
        .arrow.open { transform: rotate(180deg); }
        .dd-badge { font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; }
        .dd-buy { background: #10b98120; color: #10b981; }
        .dd-watch { background: #f59e0b20; color: #f59e0b; }
        .dd-pass { background: #64748b20; color: #94a3b8; }

        .bd { padding: 0 14px 14px; display: flex; flex-direction: column; gap: 12px; }
        .metrics { display: flex; gap: 6px; flex-wrap: wrap; padding: 10px; background: #0f172a; border-radius: 8px; }
        .metric { display: flex; flex-direction: column; align-items: center; min-width: 50px; padding: 4px 6px; flex: 1; }
        .ml { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.3px; }
        .mv { font-size: 14px; font-weight: 600; color: #e2e8f0; margin-top: 2px; }

        .progress-section { display: flex; flex-direction: column; gap: 8px; padding: 10px; background: #0f172a; border-radius: 8px; }
        .progress-row { display: flex; align-items: center; gap: 10px; }
        .progress-label { font-size: 11px; color: #64748b; min-width: 55px; }
        .progress-bar { flex: 1; height: 8px; background: #1e293b; border-radius: 4px; overflow: hidden; }
        .progress-fill { height: 100%; border-radius: 4px; transition: width 0.3s; }
        .progress-fill.sl { background: #ef4444; }
        .progress-fill.tp { background: #10b981; }

        .total-row { display: flex; gap: 6px; padding: 12px 14px; border-top: 1px solid #334155; font-weight: 700; color: #f1f5f9; background: #1e293b; border-radius: 10px; margin-top: 4px; }
        .total-row .col-num { color: #f1f5f9; }

        .empty { text-align: center; padding: 48px 16px; color: #64748b; }
        .empty-icon { font-size: 40px; margin-bottom: 12px; }
        .empty-sub { font-size: 13px; color: #4b5563; margin-top: 6px; }

        .footer { display: flex; justify-content: space-between; align-items: center; padding: 8px 14px; color: #64748b; font-size: 13px; }
        .refresh-btn { font-size: 13px; padding: 6px 14px; border-radius: 8px; border: 1px solid #334155; background: #0f172a; color: #94a3b8; cursor: pointer; min-height: 36px; }
        .refresh-btn:hover { background: #1e293b; color: #e2e8f0; }

        @media (max-width: 600px) {
          .tbl-hd { display: none; }
          .row { flex-wrap: wrap; padding: 10px; gap: 4px; }
          .col-tkr { flex: 0 0 55px; }
          .col-dir { flex: 0 0 36px; }
          .col-num { font-size: 13px; min-width: 40px; }
          .col-dd { flex: 0 0 44px; }
          .stat { min-width: 60px; padding: 10px 12px; }
          .stat .n { font-size: 16px; }
          .summary { gap: 6px; }
          .footer { flex-direction: column; gap: 8px; }
        }
      `}</style>
    </div>
  )
}

function formatUSD(v) {
  if (v == null || isNaN(v)) return '—'
  const abs = Math.abs(v)
  const formatted = abs >= 1000
    ? '$' + abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '$' + abs.toFixed(2)
  return v < 0 ? '-' + formatted : formatted
}
