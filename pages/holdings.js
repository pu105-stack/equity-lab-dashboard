import { useState, useEffect } from 'react'

const PNL_COLOR = (v) => v > 0 ? '#10b981' : v < 0 ? '#ef4444' : '#94a3b8'
const DD_COLORS = { BUY: '#10b981', WATCH: '#f59e0b', PASS: '#64748b' }
const SPARK_W = 80; const SPARK_H = 28

function Sparkline({ data, color }) {
  if (!data || data.length < 2) return <span style={{ color: '#4b5563', fontSize: 11 }}>—</span>
  const min = Math.min(...data); const max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((v, i) =>
    `${(i / (data.length - 1)) * SPARK_W},${SPARK_H - ((v - min) / range) * (SPARK_H - 4) - 2}`
  ).join(' ')
  return (
    <svg width={SPARK_W} height={SPARK_H} viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}>
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={pts} />
    </svg>
  )
}

function Donut({ items, total }) {
  const colors = ['#10b981','#f59e0b','#6366f1','#ec4899','#06b6d4','#f97316','#8b5cf6','#94a3b8']
  let offset = 0; const r = 80; const circ = 2 * Math.PI * r
  return (
    <svg width="220" height="220" viewBox="0 0 200 200">
      {items.map((item, i) => {
        const pct = item.value / total
        const len = pct * circ
        const dash = `${len} ${circ - len}`
        const s = { strokeDasharray: dash, strokeDashoffset: -offset }
        offset += len
        return <circle key={i} cx="100" cy="100" r={r} fill="none" stroke={colors[i % colors.length]} strokeWidth="24" transform="rotate(-90 100 100)" style={s} />
      })}
      <text x="100" y="94" textAnchor="middle" fill="#f1f5f9" fontSize="24" fontWeight="800">{total > 0 ? '$' + Math.round(total).toLocaleString() : '—'}</text>
      <text x="100" y="114" textAnchor="middle" fill="#64748b" fontSize="13">Total</text>
    </svg>
  )
}

export default function PortfolioPage() {
  const [account, setAccount] = useState(null)
  const [positions, setPositions] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState({})

  const load = async () => {
    try {
      const resp = await fetch('/api/holdings')
      const data = await resp.json()
      setAccount(data.account)
      setPositions(data.positions || [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const toggle = (ticker) => setOpen(p => ({ ...p, [ticker]: !p[ticker] }))

  if (loading) return (
    <div className="container">
      <div className="header"><h1>📊 Portfolio</h1></div>
      <p style={{ color: '#64748b' }}>Loading...</p>
    </div>
  )

  const hdrColor = PNL_COLOR(account?.pnl)
  const allocItems = (positions || []).map(p => ({ ticker: p.ticker, value: p.market_value || 0 }))
  if (account?.cash) allocItems.push({ ticker: 'Cash', value: account.cash })

  return (
    <div className="container">
      <div className="header">
        <h1>📊 Portfolio</h1>
        <div className="date">Anya 嘅持倉 · via Yahoo Finance</div>
      </div>

      {/* Hero — Total Value */}
      {account && (
        <div className="hero">
          <div className="hero-val">{fmt(account.equity)}</div>
          <div className="hero-change" style={{ color: hdrColor }}>
            <span className="hero-dir">{account.pnl >= 0 ? '▲' : '▼'}</span>
            <span>{account.pnl >= 0 ? '+' : ''}{fmt(account.pnl)} ({account.pnl_pct >= 0 ? '+' : ''}{account.pnl_pct?.toFixed(2)}%)</span>
          </div>
          <div className="hero-sub">
            <span>💵 Cash {fmt(account.cash)}</span>
            <span className="hero-dot">·</span>
            <span>💰 Initial {fmt(account.initial)}</span>
          </div>
        </div>
      )}

      {/* Chart Row */}
      {positions.length > 0 && (
        <div className="chart-row">
      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="scard">
          <div className="scard-l">Positions</div>
          <div className="scard-v">{positions.length}</div>
        </div>
        <div className="scard">
          <div className="scard-l">Total P&L</div>
          <div className="scard-v" style={{ color: hdrColor }}>{account?.pnl >= 0 ? '+' : ''}{fmt(account?.pnl)}</div>
        </div>
        <div className="scard">
          <div className="scard-l">Best</div>
          <div className="scard-v" style={{ color: '#10b981' }}>
            {positions.reduce((b, p) => (p.pnl_pct || 0) > (b?.pnl_pct || -Infinity) ? p : b, positions[0])?.ticker || '—'}
          </div>
        </div>
        <div className="scard">
          <div className="scard-l">Worst</div>
          <div className="scard-v" style={{ color: '#ef4444' }}>
            {positions.reduce((w, p) => (p.pnl_pct || Infinity) < (w?.pnl_pct || Infinity) ? p : w, positions[0])?.ticker || '—'}
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      {positions.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">✨</div>
          <div>No open positions</div>
          <div className="empty-sub">Anya 未有持倉</div>
        </div>
      ) : (
        <>
        <div className="tl">
          {positions.map(p => {
            const isOpen = !!open[p.ticker]
            const c = PNL_COLOR(p.pnl)
            const ddColor = DD_COLORS[p.dd_decision] || '#64748b'

            return (
              <div key={p.ticker} className="card">
                <div className="row" onClick={() => toggle(p.ticker)}>
                  <div className="row-left">
                    <span className="tkr">{p.ticker}</span>
                    <div className="row-meta">
                      <span className="dir" style={{ color: p.direction === 'LONG' ? '#10b981' : '#ef4444' }}>{p.direction}</span>
                      <span className="qty">{p.quantity} sh</span>
                    </div>
                  </div>
                  <div className="row-price">
                    <div className="price-line">
                      <span className="entry-dot" style={{ background: '#64748b' }} />
                      <span className="entry-line" />
                      <span className="live-dot" style={{ background: c }} />
                    </div>
                    <div className="price-labels">
                      <span style={{ color: '#64748b', fontSize: 11 }}>E {fmt(p.entry_price)}</span>
                      <span style={{ color: c, fontSize: 12, fontWeight: 600, marginLeft: 8 }}>{p.live_price ? fmt(p.live_price) : '—'}</span>
                    </div>
                  </div>
                  <div className="row-pnl" style={{ color: c }}>
                    <div className="pnl-val">{p.pnl >= 0 ? '+' : ''}{fmt(p.pnl)}</div>
                    <div className="pnl-pct">{p.pnl_pct >= 0 ? '+' : ''}{p.pnl_pct?.toFixed(2)}%</div>
                  </div>
                  <div className="row-spark">
                    <Sparkline data={p.sparkline} color={c} />
                  </div>
                  <div className="row-dd">
                    <span className="dd-badge" style={{ background: ddColor + '20', color: ddColor }}>{p.dd_decision || '—'}</span>
                  </div>
                  <div className="row-arrow">
                    <span className={`arrow ${isOpen ? 'open' : ''}`}>▼</span>
                  </div>
                </div>

                {/* Expanded Detail */}
                {isOpen && (
                  <div className="bd">
                    <div className="detail-grid">
                      <div className="dg-item"><span className="dg-l">Entry</span><span className="dg-v">{fmt(p.entry_price)}</span></div>
                      <div className="dg-item"><span className="dg-l">Live</span><span className="dg-v" style={{ color: c }}>{p.live_price ? fmt(p.live_price) : '—'}</span></div>
                      <div className="dg-item"><span className="dg-l">SL</span><span className="dg-v" style={{ color: '#ef4444' }}>{fmt(p.stop_loss)}</span></div>
                      <div className="dg-item"><span className="dg-l">TP</span><span className="dg-v" style={{ color: '#10b981' }}>{fmt(p.take_profit)}</span></div>
                      <div className="dg-item"><span className="dg-l">Mkt Val</span><span className="dg-v">{p.market_value ? fmt(p.market_value) : '—'}</span></div>
                      <div className="dg-item"><span className="dg-l">Opened</span><span className="dg-v">{p.opened_at?.slice(0, 10) || '—'}</span></div>
                      <div className="dg-item"><span className="dg-l">F.V.</span><span className="dg-v">{p.dd_fair_value ? fmt(p.dd_fair_value) : '—'}</span></div>
                      <div className="dg-item"><span className="dg-l">Conviction</span><span className="dg-v">{p.dd_conviction || '—'}</span></div>
                    </div>

                    {/* Progress bars */}
                    <div className="progress-section">
                      <div className="progress-row">
                        <span className="progress-label">→ SL</span>
                        <div className="progress-bar"><div className="progress-fill sl" style={{ width: p.stop_loss > 0 && p.entry_price > 0 && p.live_price ? `${Math.min(Math.abs(((p.live_price - p.entry_price) / (p.stop_loss - p.entry_price)) * 100), 100)}%` : '0%' }} /></div>
                        <span className="progress-val" style={{ color: '#ef4444' }}>{p.stop_loss > 0 && p.entry_price > 0 && p.live_price ? `${Math.abs(((p.live_price - p.entry_price) / (p.stop_loss - p.entry_price)) * 100).toFixed(0)}%` : '—'}</span>
                      </div>
                      <div className="progress-row">
                        <span className="progress-label">→ TP</span>
                        <div className="progress-bar"><div className="progress-fill tp" style={{ width: p.take_profit > 0 && p.entry_price > 0 && p.live_price ? `${Math.min(Math.abs(((p.live_price - p.entry_price) / (p.take_profit - p.entry_price)) * 100), 100)}%` : '0%' }} /></div>
                        <span className="progress-val" style={{ color: '#10b981' }}>{p.take_profit > 0 && p.entry_price > 0 && p.live_price ? `${Math.abs(((p.live_price - p.entry_price) / (p.take_profit - p.entry_price)) * 100).toFixed(0)}%` : '—'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Allocation Donut — bottom */}
      {positions.length > 0 && (
        <div className="allocation-section">
          <div className="allocation-title">Allocation</div>
          <div className="allocation-content">
            <Donut items={allocItems} total={account?.equity || 0} />
            <div className="allocation-legend">
              {positions.map((p, i) => {
                const colors = ['#10b981','#f59e0b','#6366f1','#ec4899','#06b6d4','#f97316','#8b5cf6','#94a3b8']
                return (
                  <div key={p.ticker} className="al-item">
                    <span className="al-dot" style={{ background: colors[i % colors.length] }} />
                    <span className="al-tkr">{p.ticker}</span>
                    <span className="al-bar-bg"><span className="al-bar-fill" style={{ width: `${((p.market_value || 0) / (account?.equity || 1) * 100)}%`, background: colors[i % colors.length] }} /></span>
                    <span className="al-pct">{((p.market_value || 0) / (account?.equity || 1) * 100).toFixed(1)}%</span>
                    <span className="al-val">{fmt(p.market_value || 0)}</span>
                  </div>
                )
              })}
              {/* Cash row */}
              <div className="al-item">
                <span className="al-dot" style={{ background: '#94a3b8' }} />
                <span className="al-tkr">Cash</span>
                <span className="al-bar-bg"><span className="al-bar-fill" style={{ width: `${((account?.cash || 0) / (account?.equity || 1) * 100)}%`, background: '#94a3b8' }} /></span>
                <span className="al-pct">{((account?.cash || 0) / (account?.equity || 1) * 100).toFixed(1)}%</span>
                <span className="al-val">{fmt(account?.cash || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {positions.length > 0 && (
        <div className="footer">
          <span>🔹 Data via Yahoo Finance · 開頁時 fetch · {new Date().toLocaleTimeString('zh-HK', { hour12: false })}</span>
        </div>
      )}

      <style jsx>{`
        /* Hero */
        .hero { text-align: center; padding: 24px 0 20px; }
        .hero-val { font-size: 36px; font-weight: 800; color: #f1f5f9; letter-spacing: -0.5px; }
        .hero-change { font-size: 18px; font-weight: 600; margin-top: 4px; display: flex; align-items: center; justify-content: center; gap: 4px; }
        .hero-dir { font-size: 14px; }
        .hero-sub { font-size: 13px; color: #64748b; margin-top: 6px; display: flex; gap: 6px; justify-content: center; }
        .hero-dot { color: #334155; }

        /* Summary Cards */
        .summary-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 20px; }
        .scard { background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 12px; display: flex; flex-direction: column; justify-content: center; }
        .scard-l { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.3px; }
        .scard-v { font-size: 18px; font-weight: 700; color: #f1f5f9; margin-top: 4px; }

        /* Allocation */
        .allocation-section { margin-top: 20px; background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 16px; }
        .allocation-title { font-size: 14px; font-weight: 600; color: #f1f5f9; margin-bottom: 12px; }
        .allocation-content { display: flex; gap: 24px; align-items: flex-start; }
        .allocation-legend { flex: 1; display: flex; flex-direction: column; gap: 6px; min-width: 0; }
        .al-item { display: flex; align-items: center; gap: 8px; font-size: 13px; }
        .al-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
        .al-tkr { font-weight: 600; color: #e2e8f0; min-width: 48px; font-family: monospace; }
        .al-bar-bg { flex: 1; height: 6px; background: #0f172a; border-radius: 3px; overflow: hidden; min-width: 40px; }
        .al-bar-fill { height: 100%; border-radius: 3px; }
        .al-pct { color: #94a3b8; min-width: 42px; text-align: right; font-weight: 500; }
        .al-val { color: #64748b; min-width: 60px; text-align: right; }

        /* Holdings */
        .tl { display: flex; flex-direction: column; gap: 6px; }
        .card { background: #1e293b; border: 1px solid #334155; border-radius: 10px; overflow: hidden; }
        .row { display: flex; align-items: center; gap: 8px; padding: 12px 14px; cursor: pointer; min-height: 52px; }
        .row:hover { background: rgba(255,255,255,0.02); }

        .row-left { flex: 0 0 72px; }
        .tkr { font-size: 16px; font-weight: 700; font-family: monospace; color: #f1f5f9; }
        .row-meta { display: flex; gap: 4px; font-size: 11px; margin-top: 1px; }
        .dir { font-weight: 600; }
        .qty { color: #64748b; }

        .row-price { flex: 1; min-width: 0; }
        .price-line { display: flex; align-items: center; gap: 2px; margin-bottom: 2px; }
        .entry-dot { width: 5px; height: 5px; border-radius: 50%; }
        .entry-line { flex: 1; height: 1px; background: #334155; position: relative; }
        .entry-line::after { content: ''; position: absolute; right: 0; top: -1px; width: 7px; height: 3px; border-radius: 1px; }
        .live-dot { width: 6px; height: 6px; border-radius: 50%; margin-left: auto; }
        .price-labels { display: flex; justify-content: space-between; }

        .row-pnl { flex: 0 0 80px; text-align: right; }
        .pnl-val { font-size: 14px; font-weight: 600; }
        .pnl-pct { font-size: 11px; opacity: 0.8; }

        .row-spark { flex: 0 0 80px; display: flex; align-items: center; justify-content: center; }
        .row-dd { flex: 0 0 44px; text-align: center; }
        .dd-badge { font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; }
        .row-arrow { flex: 0 0 16px; }
        .arrow { font-size: 11px; color: #64748b; transition: transform 0.2s; }
        .arrow.open { transform: rotate(180deg); }

        /* Detail */
        .bd { padding: 0 14px 14px; display: flex; flex-direction: column; gap: 12px; }
        .detail-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; padding: 10px; background: #0f172a; border-radius: 8px; }
        .dg-item { display: flex; flex-direction: column; align-items: center; }
        .dg-l { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.3px; }
        .dg-v { font-size: 14px; font-weight: 600; color: #e2e8f0; margin-top: 2px; }

        .progress-section { display: flex; flex-direction: column; gap: 6px; padding: 10px; background: #0f172a; border-radius: 8px; }
        .progress-row { display: flex; align-items: center; gap: 8px; }
        .progress-label { font-size: 11px; color: #64748b; min-width: 30px; }
        .progress-bar { flex: 1; height: 6px; background: #1e293b; border-radius: 3px; overflow: hidden; }
        .progress-fill { height: 100%; border-radius: 3px; transition: width 0.3s; }
        .progress-fill.sl { background: #ef4444; }
        .progress-fill.tp { background: #10b981; }
        .progress-val { font-size: 11px; font-weight: 600; min-width: 32px; text-align: right; }

        .empty { text-align: center; padding: 48px 16px; color: #64748b; }
        .empty-icon { font-size: 40px; margin-bottom: 12px; }
        .empty-sub { font-size: 13px; color: #4b5563; margin-top: 6px; }
        .footer { text-align: center; padding: 12px; color: #64748b; font-size: 12px; }

        @media (max-width: 600px) {
          .hero-val { font-size: 28px; }
          .summary-cards { grid-template-columns: repeat(2, 1fr); }
          .allocation-content { flex-direction: column; align-items: center; }
          .row { flex-wrap: wrap; padding: 10px; gap: 4px; }
          .row-spark { display: none; }
          .row-dd { flex: 0 0 38px; }
          .row-pnl { flex: 0 0 70px; }
          .detail-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </div>
  )
}

function fmt(v) {
  if (v == null || isNaN(v)) return '—'
  const abs = Math.abs(v)
  const s = abs >= 1000
    ? '$' + abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '$' + abs.toFixed(2)
  return v < 0 ? '-' + s : s
}
