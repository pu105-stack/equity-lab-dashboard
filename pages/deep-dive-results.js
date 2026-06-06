import { useState, useEffect } from 'react'

const STATUS_OPTIONS = [
  { value: 'pending', label: '⏳ Pending', color: '#64748b' },
  { value: 'in_progress', label: '🔍 In Progress', color: '#f59e0b' },
  { value: 'done', label: '✅ Done', color: '#10b981' },
  { value: 'archived', label: '📦 Archived', color: '#6b7280' },
]

export default function DeepDiveResults() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState({})
  const [filterTicker, setFilterTicker] = useState('')
  const [sortOrder, setSortOrder] = useState('newest')

  useEffect(() => {
    async function load() {
      try {
        // Try API first (live data on Vercel)
        const resp = await fetch('/api/deep-dive-results')
        if (resp.ok) {
          const data = await resp.json()
          if (data.results && data.results.length > 0) {
            setResults(data.results)
            setLoading(false)
            return
          }
        }
      } catch {}
      
      // Fallback: public JSON (for build/deploy demo)
      try {
        const resp = await fetch('/data/deep-dive-results.json')
        const data = await resp.json()
        setResults(data.results || [])
      } catch {}
      
      setLoading(false)
    }
    load()
  }, [])

  const toggle = (ticker) => setOpen(p => ({ ...p, [ticker]: !p[ticker] }))

  const archiveResult = async (ticker) => {
    try {
      // Remove from results
      await fetch('/api/deep-dive-results', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker })
      })
      
      // Also update candidate status to 'done' on the Deep Dive page
      await fetch('/api/deep-dive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decisions: [{ ticker, status: 'done', updated_at: new Date().toISOString() }],
          merge: true
        })
      })
      
      setResults(prev => prev.filter(r => r.ticker !== ticker))
    } catch (e) {
      console.error('Archive error:', e)
    }
  }

  // Filter + sort
  let filteredResults = results.filter(r => r.status !== 'archived')
  if (filterTicker) {
    const q = filterTicker.toUpperCase()
    filteredResults = filteredResults.filter(r => r.ticker.includes(q))
  }
  filteredResults.sort((a, b) => {
    const ta = a.completed_at || ''
    const tb = b.completed_at || ''
    return sortOrder === 'newest' ? tb.localeCompare(ta) : ta.localeCompare(tb)
  })
  const archivedResults = results.filter(r => r.status === 'archived')

  if (loading) return <div className="container"><div className="header"><h1>🔬 Deep Dive Results</h1></div><p style={{ color: '#64748b' }}>Loading...</p></div>

  return (
    <div className="container">
      <div className="header">
        <h1>🔬 Deep Dive Results</h1>
        <div className="date">Maya 做完 deep dive 嘅 tickers</div>
      </div>

      {/* Stats */}
      <div className="summary">
        <div className="stat"><span className="n">{filteredResults.length}</span><span className="l">Active</span></div>
        <div className="stat"><span className="n" style={{ color: '#10b981' }}>{filteredResults.filter(r => r.status === 'done').length}</span><span className="l">✅ Done</span></div>
        <div className="stat"><span className="n" style={{ color: '#f59e0b' }}>{filteredResults.filter(r => r.status === 'in_progress').length}</span><span className="l">🔍 In Progress</span></div>
        <div className="stat"><span className="n" style={{ color: '#64748b' }}>{archivedResults.length}</span><span className="l">📦 Archived</span></div>
      </div>

      {/* Filter + Sort */}
      <div className="filters">
        <input
          className="filter-input"
          type="text"
          placeholder="Filter by ticker..."
          value={filterTicker}
          onChange={e => setFilterTicker(e.target.value)}
        />
        <select className="sort-select" value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
          <option value="newest">🕐 Newest first</option>
          <option value="oldest">🕐 Oldest first</option>
        </select>
      </div>

      {/* Active Results */}
      <div className="tl">
        {filteredResults.length === 0 && (
          <div className="empty">
            <div className="empty-icon">🔬</div>
            <div>未有 deep dive results</div>
            <div className="empty-sub">Mark tickers on the Deep Dive page → Maya analyses them → they appear here</div>
          </div>
        )}

        {filteredResults.map(r => {
          const isOpen = !!open[r.ticker]
          const verdictColor = r.verdict === 'BUY' ? '#10b981' : r.verdict === 'WATCH' ? '#f59e0b' : r.verdict === 'PASS' ? '#ef4444' : '#64748b'

          return (
            <div key={r.ticker} className="card" style={{ borderLeftColor: verdictColor }}>
              {/* Header */}
              <div className="hd" onClick={() => toggle(r.ticker)}>
                <div className="tkr-badge" style={{ background: verdictColor + '20', color: verdictColor }}>{r.ticker}</div>
                <div className="info">
                  <div className="verdict" style={{ color: verdictColor }}>
                    {r.verdict || 'PENDING'} {r.upside ? `— ${r.upside}` : ''}
                  </div>
                  <div className="meta">
                    {r.completed_at?.replace('T', ' ').substring(0, 19).replace(/-/g, '/') || ''} · {r.status === 'done' ? '✅ Done' : '🔍 In Progress'}
                  </div>
                </div>
                <span className={`arrow ${isOpen ? 'open' : ''}`}>▼</span>
              </div>

              {/* Body - accordion */}
              {isOpen && (
                <div className="bd">
                  {/* Key Metrics */}
                  {r.metrics && (
                    <div className="metrics">
                      {r.metrics.pe && <div className="metric"><span className="ml">P/E</span><span className="mv">{r.metrics.pe}</span></div>}
                      {r.metrics.rev_growth && <div className="metric"><span className="ml">Rev Growth</span><span className="mv">{r.metrics.rev_growth}</span></div>}
                      {r.metrics.margin && <div className="metric"><span className="ml">Margin</span><span className="mv">{r.metrics.margin}</span></div>}
                      {r.metrics.debt_eq && <div className="metric"><span className="ml">D/E</span><span className="mv">{r.metrics.debt_eq}</span></div>}
                      {r.metrics.beta && <div className="metric"><span className="ml">Beta</span><span className="mv">{r.metrics.beta}</span></div>}
                      {r.metrics.price && <div className="metric"><span className="ml">Price</span><span className="mv">${r.metrics.price}</span></div>}
                    </div>
                  )}

                  {/* Analysis sections */}
                  {r.analysis && <div className="sec"><div className="st">📊 Analysis</div><div className="tx">{r.analysis}</div></div>}
                  {r.catalyst && <div className="sec"><div className="st">📅 Catalyst</div><div className="tx">{r.catalyst}</div></div>}
                  {r.risk_reward && <div className="sec"><div className="st">⚖️ Risk/Reward</div><div className="tx">{r.risk_reward}</div></div>}
                  {r.rationale && <div className="sec"><div className="st">🧠 Rationale</div><div className="tx rat">{r.rationale}</div></div>}

                  {/* Action Buttons */}
                  <div className="actions">
                    <button className="act-btn archive" onClick={() => archiveResult(r.ticker)}>
                      📦 Archive
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Archived */}
      {archivedResults.length > 0 && (
        <details className="archived">
          <summary className="archived-summary">📦 Archived ({archivedResults.length})</summary>
          <div className="archived-list">
            {archivedResults.map(r => (
              <div key={r.ticker} className="archived-item">
                <span className="archived-tkr">{r.ticker}</span>
                <span className="archived-v">{r.verdict || '—'}</span>
                <span className="archived-d">{r.completed_at?.replace('T', ' ').substring(0, 19).replace(/-/g, '/') || ''}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      <div className="footer">
        <span>🔹 Completed deep dives appear here. Archive to keep things clean.</span>
        <span className="deploy-badge">⚡ Live</span>
      </div>

      <style jsx>{`
        .summary { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
        .stat { background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 14px 20px; display: flex; flex-direction: column; align-items: center; min-width: 80px; }
        .stat .n { font-size: 24px; font-weight: 700; color: #f1f5f9; }
        .stat .l { font-size: 11px; color: #94a3b8; margin-top: 4px; }
        .filters { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
        .filter-input { font-size: 13px; padding: 8px 14px; border-radius: 8px; border: 1px solid #334155; background: #0f172a; color: #e2e8f0; outline: none; flex: 1; min-width: 140px; max-width: 220px; }
        .filter-input:focus { border-color: #6366f1; }
        .filter-input::placeholder { color: #4b5563; }
        .sort-select { font-size: 13px; padding: 8px 14px; border-radius: 8px; border: 1px solid #334155; background: #0f172a; color: #e2e8f0; cursor: pointer; }
        .sort-select:focus { outline: none; border-color: #6366f1; }
        .sort-select option { background: #0f172a; color: #e2e8f0; }
        .tl { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
        .card { background: #1e293b; border: 1px solid #334155; border-left: 4px solid #888; border-radius: 10px; overflow: hidden; }
        .hd { display: flex; align-items: center; gap: 12px; padding: 14px 16px; cursor: pointer; user-select: none; }
        .hd:hover { background: rgba(255,255,255,0.02); }
        .tkr-badge { font-size: 16px; font-weight: 700; font-family: monospace; padding: 4px 12px; border-radius: 8px; flex-shrink: 0; min-width: 60px; text-align: center; }
        .info { flex: 1; min-width: 0; }
        .verdict { font-size: 14px; font-weight: 600; }
        .meta { font-size: 11px; color: #64748b; margin-top: 2px; }
        .arrow { font-size: 10px; color: #64748b; transition: transform 0.2s; }
        .arrow.open { transform: rotate(180deg); }
        .bd { padding: 0 16px 16px; display: flex; flex-direction: column; gap: 12px; }
        .metrics { display: flex; gap: 8px; flex-wrap: wrap; padding: 10px; background: #0f172a; border-radius: 8px; }
        .metric { display: flex; flex-direction: column; align-items: center; min-width: 55px; padding: 4px 8px; }
        .ml { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
        .mv { font-size: 14px; font-weight: 600; color: #e2e8f0; margin-top: 2px; }
        .sec { margin-top: 4px; }
        .st { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .tx { font-size: 13px; color: #cbd5e1; line-height: 1.6; white-space: pre-wrap; }
        .tx.rat { color: #a5b4fc; font-style: italic; }
        .actions { display: flex; gap: 8px; margin-top: 8px; }
        .act-btn { font-size: 12px; font-weight: 500; padding: 6px 14px; border-radius: 6px; border: none; cursor: pointer; transition: all 0.15s; }
        .act-btn.archive { background: #374151; color: #9ca3af; }
        .act-btn.archive:hover { background: #4b5563; color: #e5e7eb; }
        .empty { text-align: center; padding: 48px; color: #64748b; }
        .empty-icon { font-size: 40px; margin-bottom: 12px; }
        .empty-sub { font-size: 12px; color: #4b5563; margin-top: 6px; }
        .archived { margin-top: 12px; }
        .archived-summary { font-size: 13px; color: #6b7280; cursor: pointer; padding: 8px 0; }
        .archived-list { display: flex; flex-direction: column; gap: 4px; padding: 8px 0; }
        .archived-item { display: flex; gap: 16px; font-size: 12px; color: #6b7280; padding: 4px 0; border-bottom: 1px solid #1c2128; }
        .archived-tkr { font-family: monospace; font-weight: 600; min-width: 60px; }
        .archived-v { color: #9ca3af; min-width: 60px; }
        .archived-d { color: #4b5563; margin-left: auto; }
      `}</style>
    </div>
  )
}
