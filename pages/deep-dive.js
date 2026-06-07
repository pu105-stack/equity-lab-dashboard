import { useState, useEffect } from 'react'

const STATUS_OPTIONS = [
  { value: 'pending', label: '⏳ 待決定', color: '#64748b' },
  { value: 'deep_dive', label: '🔍 要做 Deep Dive', color: '#f59e0b' },
  { value: 'skip', label: '❌ Skip', color: '#ef4444' },
  { value: 'done', label: '✅ Done', color: '#10b981' },
]

const STATUS_MAP = Object.fromEntries(STATUS_OPTIONS.map(s => [s.value, s]))

export default function DeepDiveCandidates() {
  const [entries, setEntries] = useState([])
  const [decisions, setDecisions] = useState({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  // Load candidates from DB
  useEffect(() => {
    async function load() {
      try {
        // Fetch decisions from Vercel API (user's pending/skip/deep_dive choices)
        const decResp = await fetch('/api/deep-dive')
        const decData = await decResp.json()
        const decMap = {}
        if (decData.decisions) {
          decData.decisions.forEach(d => { decMap[d.ticker] = d.status })
        }

        // Fetch candidates from DB (weekly_screen where not done/skip)
        const candResp = await fetch('/api/candidates')
        const candData = await candResp.json()

        if (!candData.candidates || candData.candidates.length === 0) {
          setEntries([])
          setLoading(false)
          return
        }

        // Build entries: DB data + user decisions
        const tickerEntries = candData.candidates.map(c => ({
          ticker: c.ticker,
          reason: c.reasoning || c.verdict || c.source_reason || '',
          verdict: c.verdict || '',
          conviction: c.conviction || '',
          source: c.category,
          date: c.screen_date,
          status: decMap[c.ticker] || c.status || 'pending'
        }))

        setEntries(tickerEntries)

        // Init decisions map
        const fullDecMap = { ...decMap }
        tickerEntries.forEach(e => {
          if (!fullDecMap[e.ticker]) {
            fullDecMap[e.ticker] = e.status
          }
        })
        setDecisions(fullDecMap)

      } catch (e) {
        console.error('Load error:', e)
      }
      setLoading(false)
    }
    load()
  }, [])
  const setStatus = (ticker, status) => {
    setDecisions(prev => ({ ...prev, [ticker]: status }))
    setEntries(prev => prev.map(e => e.ticker === ticker ? { ...e, status } : e))
    setSaved(false)
  }

  const saveDecisions = async () => {
    setSaving(true)
    try {
      const decisionsArr = Object.entries(decisions).map(([ticker, status]) => ({
        ticker,
        status,
        updated_at: new Date().toISOString()
      }))
      
      const resp = await fetch('/api/deep-dive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decisions: decisionsArr })
      })
      
      if (resp.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (e) {
      console.error('Save error:', e)
    }
    setSaving(false)
  }

  const getCounts = () => {
    const counts = { pending: 0, deep_dive: 0, skip: 0, done: 0 }
    Object.values(decisions).forEach(s => { if (counts[s] !== undefined) counts[s]++ })
    return counts
  }
  const counts = getCounts()

  if (loading) return <div className="container"><div className="header"><h1>🔍 Deep Dive Candidates</h1></div><p style={{ color: '#64748b' }}>Loading...</p></div>

  return (
    <div className="container">
      <div className="header">
        <h1>🔍 Deep Dive Candidates</h1>
        <div className="date">從 Weekly Screen 揀邊啲要做 deep dive</div>
      </div>

      {/* Summary */}
      <div className="summary">
        <div className="stat"><span className="n">{entries.length}</span><span className="l">Total Candidates</span></div>
        <div className="stat"><span className="n" style={{ color: '#f59e0b' }}>{counts.deep_dive}</span><span className="l">🔍 Deep Dive</span></div>
        <div className="stat"><span className="n" style={{ color: '#ef4444' }}>{counts.skip}</span><span className="l">❌ Skip</span></div>
        <div className="stat"><span className="n" style={{ color: '#10b981' }}>{counts.done}</span><span className="l">✅ Done</span></div>
        <div className="stat"><span className="n" style={{ color: '#64748b' }}>{counts.pending}</span><span className="l">⏳ Pending</span></div>
      </div>

      {/* Ticker List */}
      <div className="tl">
        {entries.length === 0 && <div className="empty">未有 Weekly Screen data — 星期六 6am 先有</div>}
        
        {entries.map((e, i) => {
          const status = STATUS_MAP[e.status] || STATUS_MAP.pending
          
          return (
            <div key={e.ticker} className="card" style={{ borderLeftColor: status.color }}>
              <div className="hd">
              <div className="info">
                    <div className="tkr-line">
                      <span className="tkr">{e.ticker}</span>
                      <span className={`src-badge ${e.source}`}>
                        {e.source === 'high_confidence' ? '🎯 機會' : e.source === 'worth_watching' ? '📡 關注' : e.source === 'theme' ? '📌 主題' : e.source}
                      </span>
                      {e.verdict && <span className="verdict-badge">{e.verdict}</span>}
                      {e.conviction && <span className="conv-badge">{e.conviction}</span>}
                    </div>
                    <div className="rsn">{e.reason || '—'}</div>
                    {e.date && <div className="dt">{e.date}</div>}
                  </div>
                <select 
                  className="sel"
                  value={e.status}
                  onChange={(ev) => setStatus(e.ticker, ev.target.value)}
                  style={{ borderColor: status.color }}
                >
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )
        })}
      </div>

      {/* Save Button */}
      {entries.length > 0 && (
        <div className="save-bar">
          <button 
            className={`save-btn ${saved ? 'saved' : ''}`}
            onClick={saveDecisions}
            disabled={saving}
          >
            {saving ? '⏳ Saving...' : saved ? '✅ Saved!' : '💾 Save Decisions'}
          </button>
          <span className="save-hint">
            Maya 會嚟呢版睇你 mark 咗 🔍 Deep Dive 嘅 tickers
          </span>
        </div>
      )}

      {/* Legend */}
      <div className="legend">
        {STATUS_OPTIONS.map(opt => (
          <span key={opt.value} className="leg-item">
            <span className="leg-dot" style={{ background: opt.color }}></span>
            {opt.label}
          </span>
        ))}
      </div>

      <div className="footer">
        <span>🔹 改完 dropdown → Sync to Maya → 我就開工 deep dive</span>
        <span className="deploy-badge">⚡ Live</span>
      </div>

      <style jsx>{`
        .summary { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
        .stat { background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 12px 16px; display: flex; flex-direction: column; align-items: center; min-width: 72px; flex: 1; }
        .stat .n { font-size: 22px; font-weight: 700; color: #f1f5f9; }
        .stat .l { font-size: 12px; color: #94a3b8; margin-top: 3px; }
        .tl { display: flex; flex-direction: column; gap: 6px; margin-bottom: 20px; }
        .card { background: #1e293b; border: 1px solid #334155; border-left: 4px solid #888; border-radius: 10px; overflow: hidden; }
        .hd { display: flex; align-items: center; gap: 10px; padding: 12px 14px; flex-wrap: wrap; }
        .info { flex: 1; min-width: 0; }
        .tkr-line { display: flex; align-items: center; gap: 8px; margin-bottom: 2px; flex-wrap: wrap; }
        .tkr { font-size: 16px; font-weight: 700; color: #f1f5f9; font-family: monospace; }
        .src-badge { font-size: 11px; padding: 3px 8px; border-radius: 5px; font-weight: 500; background: #334155; color: #94a3b8; text-transform: uppercase; }
        .src-badge.headlines { background: rgba(16,185,129,0.15); color: #10b981; }
        .src-badge.high_confidence { background: rgba(16,185,129,0.15); color: #10b981; }
        .src-badge.worth_watching { background: rgba(245,158,11,0.15); color: #fbbf24; }
        .src-badge.theme { background: rgba(99,102,241,0.15); color: #818cf8; }
        .rsn { font-size: 13px; color: #94a3b8; line-height: 1.5; }
        .verdict-badge { font-size: 11px; padding: 2px 8px; border-radius: 4px; font-weight: 600; background: rgba(99,102,241,0.15); color: #818cf8; }
        .conv-badge { font-size: 11px; padding: 2px 8px; border-radius: 4px; font-weight: 600; background: rgba(245,158,11,0.15); color: #fbbf24; }
        .dt { font-size: 12px; color: #64748b; margin-top: 3px; }
        .sel { font-size: 14px; padding: 8px 12px; border-radius: 8px; border: 1px solid #334155; background: #0f172a; color: #e2e8f0; cursor: pointer; flex-shrink: 0; min-width: 140px; font-weight: 500; min-height: 38px; }
        .sel:focus { outline: none; border-color: #6366f1; }
        .sel option { background: #0f172a; color: #e2e8f0; }
        .empty { text-align: center; padding: 48px 16px; color: #64748b; font-size: 14px; }
        .save-bar { display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: #1e293b; border: 1px solid #334155; border-radius: 12px; margin-bottom: 16px; flex-wrap: wrap; }
        .save-btn { font-size: 15px; font-weight: 600; padding: 10px 20px; border-radius: 10px; border: none; background: #6366f1; color: #fff; cursor: pointer; transition: all 0.2s; min-height: 40px; }
        .save-btn:hover { background: #818cf8; }
        .save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .save-btn.saved { background: #10b981; }
        .save-hint { font-size: 13px; color: #64748b; }
        .legend { display: flex; gap: 12px; padding: 10px 0; flex-wrap: wrap; }
        .leg-item { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #94a3b8; }
        .leg-dot { width: 8px; height: 8px; border-radius: 50%; }

        /* Mobile */
        @media (max-width: 600px) {
          .summary { gap: 6px; }
          .stat { min-width: 60px; padding: 10px 12px; }
          .stat .n { font-size: 18px; }
          .hd { gap: 8px; padding: 10px; flex-direction: column; align-items: stretch; }
          .sel { min-width: 100%; font-size: 13px; }
          .save-bar { flex-direction: column; align-items: stretch; }
          .save-btn { width: 100%; text-align: center; }
          .legend { gap: 8px; }
          .leg-item { font-size: 12px; }
        }
      `}</style>
    </div>
  )
}
