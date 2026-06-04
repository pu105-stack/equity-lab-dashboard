import { useState } from 'react'
import runsData from '../data/daily-ops.json'

const PIPELINE_META = {
  '開市前掃瞄': { icon: '🌅', color: '#f59e0b' },
  '美股收市回顧': { icon: '🌆', color: '#6366f1' },
  '每週篩選': { icon: '📊', color: '#10b981' },
  '新聞分析-NewsCurator': { icon: '📰', color: '#ec4899' },
  'news-curator': { icon: '📰', color: '#ec4899' },
}

export default function DailyOps({ runs }) {
  const [open, setOpen] = useState({})
  const sorted = [...runs.runs].sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`))

  const toggle = (k) => setOpen(p => ({ ...p, [k]: !p[k] }))

  return (
    <div className="container">
      <div className="header">
        <h1>📋 Daily Ops</h1>
        <div className="date">Pipeline Run History</div>
      </div>

      {/* Stats */}
      <div className="stats">
        <div className="stat">
          <span className="n">{sorted.length}</span>
          <span className="l">Total Runs</span>
        </div>
        <div className="stat">
          <span className="n ok">{sorted.filter(r => r.status === 'success' || r.status === 'ok').length}</span>
          <span className="l">✅ Success</span>
        </div>
        <div className="stat">
          <span className="n fail">{sorted.filter(r => r.status === 'error').length}</span>
          <span className="l">❌ Failed</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="tl">
        {sorted.map((run, i) => {
          const meta = PIPELINE_META[run.pipeline] || { icon: '📡', color: '#888' }
          const key = `${run.date}-${run.pipeline}-${i}`
          const isOpen = !!open[key]
          const ok = run.status === 'success' || run.status === 'ok'

          return (
            <div key={key} className="card" style={{ borderLeftColor: meta.color }}>
              {/* Header - clickable */}
              <div className="hd" onClick={() => toggle(key)}>
                <span className="ic" style={{ background: meta.color + '20' }}>{meta.icon}</span>
                <div className="info">
                  <span className="nm">{run.pipeline}</span>
                  <span className="tm">{run.date} · {run.time} {isOpen ? '▲' : '▼'}</span>
                </div>
                <span className={`badge ${ok ? 'ok' : 'err'}`}>
                  {ok ? '✅ Success' : '❌ Failed'}
                </span>
              </div>

              {/* Body - accordion */}
              {isOpen && (
                <div className="bd">
                  {ok ? (
                    <>
                      {run.market_direction && <div className="row"><span className="lbl">Direction</span><span className="v">{run.market_direction}</span></div>}
                      {(run.spy || run.vix) && <div className="row"><span className="lbl">Market</span><span className="v">{[run.spy, run.vix].filter(Boolean).join(' | ')}</span></div>}
                      {run.top_gainers?.length > 0 && <div className="row"><span className="lbl">Gainers</span><span className="g">{run.top_gainers.join(' · ')}</span></div>}
                      {run.top_losers?.length > 0 && <div className="row"><span className="lbl">Losers</span><span className="l">{run.top_losers.join(' · ')}</span></div>}
                      {run.headlines?.length > 0 && <div className="sec"><div className="st">📰 Headlines</div>{run.headlines.map((h, j) => <div key={j} className="li">• {h}</div>)}</div>}
                      {run.focus?.length > 0 && <div className="sec"><div className="st">🎯 Focus</div>{run.focus.map((f, j) => <div key={j} className="li foc">• {f}</div>)}</div>}
                      {run.analysis && <div className="sec"><div className="st">💡 Analysis</div><div className="an">{run.analysis}</div></div>}
                      {run.opportunities?.length > 0 && <div className="sec"><div className="st">🎯 Opportunities</div>{run.opportunities.map((o, j) => <div key={j} className="li">• {o}</div>)}</div>}
                      {run.risks?.length > 0 && <div className="sec"><div className="st">⚠️ Risks</div>{run.risks.map((r, j) => <div key={j} className="li">• {r}</div>)}</div>}
                      {run.my_take && <div className="sec"><div className="st">🧠 Analyst Take</div><div className="an take">{run.my_take}</div></div>}
                      {run.key_takeaways?.length > 0 && <div className="row"><span className="lbl">📌 Takeaways</span><span className="v">{run.key_takeaways.join(' · ')}</span></div>}
                    </>
                  ) : (
                    <div className="err-msg">{run.error || 'Unknown error'}</div>
                  )}
                </div>
              )}
            </div>
          )
        })}
        {sorted.length === 0 && <div className="empty">No pipeline runs recorded yet.</div>}
      </div>

      <div className="footer">
        <span>Click any run to expand/collapse</span>
        <span className="db">⚡ Live</span>
      </div>

      <style jsx>{`
        .stats { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
        .stat { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 16px 24px; display: flex; flex-direction: column; align-items: center; min-width: 110px; }
        .n { font-size: 28px; font-weight: 700; color: #f1f5f9; }
        .n.ok { color: #10b981; }
        .n.fail { color: #ef4444; }
        .l { font-size: 12px; color: #94a3b8; margin-top: 4px; }
        .tl { display: flex; flex-direction: column; gap: 8px; }
        .card { background: #1e293b; border: 1px solid #334155; border-left: 4px solid #888; border-radius: 12px; overflow: hidden; }
        .hd { display: flex; align-items: center; gap: 12px; padding: 14px 20px; cursor: pointer; user-select: none; }
        .hd:hover { background: rgba(255,255,255,0.02); }
        .ic { font-size: 22px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 10px; flex-shrink: 0; }
        .info { flex: 1; min-width: 0; }
        .nm { font-size: 16px; font-weight: 600; color: #f1f5f9; display: block; }
        .tm { font-size: 12px; color: #64748b; }
        .badge { font-size: 12px; padding: 4px 10px; border-radius: 6px; font-weight: 500; flex-shrink: 0; }
        .badge.ok { background: rgba(16,185,129,0.15); color: #10b981; }
        .badge.err { background: rgba(239,68,68,0.15); color: #ef4444; }
        .bd { padding: 0 20px 16px; display: flex; flex-direction: column; gap: 8px; }
        .row { display: flex; gap: 8px; font-size: 13px; align-items: baseline; }
        .lbl { color: #64748b; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; min-width: 70px; flex-shrink: 0; }
        .v { color: #e2e8f0; }
        .g { color: #10b981; }
        .l { color: #ef4444; }
        .sec { margin-top: 4px; }
        .st { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .li { font-size: 13px; color: #cbd5e1; line-height: 1.5; padding: 1px 0; }
        .li.foc { color: #fbbf24; font-weight: 500; }
        .an { font-size: 13px; color: #a5b4fc; line-height: 1.6; font-style: italic; white-space: pre-wrap; }
        .an.take { color: #c4b5fd; }
        .err-msg { font-size: 13px; color: #fca5a5; font-family: monospace; white-space: pre-wrap; }
        .empty { text-align: center; padding: 48px; color: #64748b; font-size: 14px; }
      `}</style>
    </div>
  )
}

export function getStaticProps() {
  return { props: { runs: runsData } }
}
