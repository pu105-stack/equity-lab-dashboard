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

  // Load weekly_screen data from daily-ops.json and existing decisions
  useEffect(() => {
    async function load() {
      try {
        // Get weekly screen entries from the latest daily-ops build
        const opsResp = await fetch('/daily-ops')
        const opsHtml = await opsResp.text()
        
        // Fetch decisions from API
        const decResp = await fetch('/api/deep-dive')
        const decData = await decResp.json()
        
        // Parse existing decisions into a lookup map
        const decMap = {}
        if (decData.decisions) {
          decData.decisions.forEach(d => {
            decMap[d.ticker] = d.status
          })
        }
        setDecisions(decMap)
        
        // Get the weekly screen data - read from the API
        const dataResp = await fetch('/api/daily-ops')
        const data = await dataResp.json()
        
        // Find the latest weekly screen run
        const weeklyRuns = data.runs
          .filter(r => r.pipeline === '每週篩選')
          .sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`))
        
        if (weeklyRuns.length === 0) {
          setEntries([])
          setLoading(false)
          return
        }
        
        const latest = weeklyRuns[0]
        
        // Parse headlines and opportunities into ticker entries
        const tickerEntries = []
        const seen = new Set()
        
        // From headlines
        if (latest.headlines) {
          latest.headlines.forEach(h => {
            const match = h.match(/^([A-Z]+)\s*[—–-]\s*(.+)/)
            if (match) {
              const ticker = match[1]
              if (!seen.has(ticker)) {
                seen.add(ticker)
                tickerEntries.push({
                  ticker,
                  reason: match[2].trim(),
                  source: 'headlines',
                  status: decMap[ticker] || 'pending'
                })
              }
            }
          })
        }
        
        // From opportunities (more detailed)
        if (latest.opportunities) {
          latest.opportunities.forEach(o => {
            const match = o.match(/^[🎯👀]*\s*([A-Z]+)/)
            if (match) {
              const ticker = match[1]
              if (!seen.has(ticker)) {
                seen.add(ticker)
                tickerEntries.push({
                  ticker,
                  reason: o.substring(match[0].length).trim().substring(0, 100),
                  source: 'opportunities',
                  status: decMap[ticker] || 'pending'
                })
              }
            }
          })
        }
        
        // From focus/themes
        if (latest.focus) {
          latest.focus.forEach(f => {
            const match = f.match(/[—–-]\s*([A-Z,\s]+)/)
            if (match) {
              const tickers = match[1].split(',').map(t => t.trim()).filter(t => /^[A-Z]{1,5}$/.test(t))
              tickers.forEach(t => {
                if (!seen.has(t)) {
                  seen.add(t)
                  tickerEntries.push({
                    ticker: t,
                    reason: f.substring(0, 60),
                    source: 'theme',
                    status: decMap[t] || 'pending'
                  })
                }
              })
            }
          })
        }
        
        setEntries(tickerEntries)
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
                    <span className={`src-badge ${e.source}`}>{e.source}</span>
                  </div>
                  <div className="rsn">{e.reason}</div>
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
            {saving ? '⏳ Saving...' : saved ? '✅ Saved!' : '📤 Sync to Maya'}
          </button>
          <span className="save-hint">
            Maya 會睇住你 mark 咗 🔍 Deep Dive 嘅 tickers 逐隻分析
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
        .summary { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
        .stat { background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 14px 20px; display: flex; flex-direction: column; align-items: center; min-width: 90px; }
        .stat .n { font-size: 24px; font-weight: 700; color: #f1f5f9; }
        .stat .l { font-size: 11px; color: #94a3b8; margin-top: 4px; }
        .tl { display: flex; flex-direction: column; gap: 6px; margin-bottom: 20px; }
        .card { background: #1e293b; border: 1px solid #334155; border-left: 4px solid #888; border-radius: 10px; overflow: hidden; }
        .hd { display: flex; align-items: center; gap: 12px; padding: 12px 16px; }
        .info { flex: 1; min-width: 0; }
        .tkr-line { display: flex; align-items: center; gap: 8px; margin-bottom: 2px; }
        .tkr { font-size: 16px; font-weight: 700; color: #f1f5f9; font-family: monospace; }
        .src-badge { font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: 500; background: #334155; color: #94a3b8; text-transform: uppercase; }
        .src-badge.headlines { background: rgba(16,185,129,0.15); color: #10b981; }
        .src-badge.opportunities { background: rgba(245,158,11,0.15); color: #fbbf24; }
        .src-badge.theme { background: rgba(99,102,241,0.15); color: #818cf8; }
        .rsn { font-size: 12px; color: #94a3b8; line-height: 1.4; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 500px; }
        .sel { font-size: 13px; padding: 6px 12px; border-radius: 8px; border: 1px solid #334155; background: #0f172a; color: #e2e8f0; cursor: pointer; flex-shrink: 0; min-width: 150px; font-weight: 500; }
        .sel:focus { outline: none; border-color: #6366f1; }
        .sel option { background: #0f172a; color: #e2e8f0; }
        .empty { text-align: center; padding: 48px; color: #64748b; font-size: 14px; }
        .save-bar { display: flex; align-items: center; gap: 16px; padding: 16px 20px; background: #1e293b; border: 1px solid #334155; border-radius: 12px; margin-bottom: 20px; }
        .save-btn { font-size: 15px; font-weight: 600; padding: 10px 24px; border-radius: 10px; border: none; background: #6366f1; color: #fff; cursor: pointer; transition: all 0.2s; }
        .save-btn:hover { background: #818cf8; }
        .save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .save-btn.saved { background: #10b981; }
        .save-hint { font-size: 12px; color: #64748b; }
        .legend { display: flex; gap: 16px; padding: 12px 0; flex-wrap: wrap; }
        .leg-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #94a3b8; }
        .leg-dot { width: 8px; height: 8px; border-radius: 50%; }
      `}</style>
    </div>
  )
}
