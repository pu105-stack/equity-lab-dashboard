import runsData from '../data/daily-ops.json'

const PIPELINE_META = {
  '開市前掃瞄': { icon: '🌅', color: '#f59e0b', desc: 'Pre-market scan' },
  '美股收市回顧': { icon: '🌆', color: '#6366f1', desc: 'After-hours review' },
  '每週篩選': { icon: '📊', color: '#10b981', desc: 'Weekly screening' },
}

export default function DailyOps({ runs }) {
  const sorted = [...runs.runs].sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`))

  return (
    <div className="container">

      <div className="header">
        <h1>📋 Daily Ops</h1>
        <div className="date">Pipeline Run History</div>
      </div>

      {/* Status summary */}
      <div className="ops-summary">
        <div className="ops-stat">
          <span className="ops-num">{sorted.length}</span>
          <span className="ops-lbl">Total Runs</span>
        </div>
        <div className="ops-stat">
          <span className="ops-num success">{sorted.filter(r => r.status === 'success').length}</span>
          <span className="ops-lbl">✅ Success</span>
        </div>
        <div className="ops-stat">
          <span className="ops-num fail">{sorted.filter(r => r.status === 'error').length}</span>
          <span className="ops-lbl">❌ Failed</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="ops-timeline">
        {sorted.map((run, i) => {
          const meta = PIPELINE_META[run.pipeline] || { icon: '📡', color: '#888', desc: '' }
          const isSuccess = run.status === 'success'
          return (
            <div key={`${run.date}-${run.pipeline}-${i}`} className={`ops-card ${isSuccess ? '' : 'ops-error'}`} style={{ borderLeftColor: meta.color }}>
              <div className="ops-hd">
                <span className="ops-icon">{meta.icon}</span>
                <div className="ops-info">
                  <span className="ops-name">{run.pipeline}</span>
                  <span className="ops-meta">{run.date} · {run.time}</span>
                </div>
                <span className={`ops-badge ${isSuccess ? 'badge-ok' : 'badge-fail'}`}>
                  {isSuccess ? '✅ Success' : '❌ Failed'}
                </span>
              </div>

              {isSuccess && (
                <div className="ops-body">
                  <div className="ops-direction">
                    <span className="ops-dir-label">Direction</span>
                    <span className="ops-dir-val">{run.market_direction || 'N/A'}</span>
                  </div>

                  {(run.spy || run.vix) && (
                    <div className="ops-metrics">
                      {run.spy && <span className="ops-metric">SPY {run.spy}</span>}
                      {run.vix && <span className="ops-metric">VIX {run.vix}</span>}
                    </div>
                  )}

                  {run.top_gainers?.length > 0 && (
                    <div className="ops-movers">
                      <span className="ops-gainers">🟢 {run.top_gainers.join(' · ')}</span>
                    </div>
                  )}
                  {run.top_losers?.length > 0 && (
                    <div className="ops-movers">
                      <span className="ops-losers">🔴 {run.top_losers.join(' · ')}</span>
                    </div>
                  )}

                  {run.headlines?.length > 0 && (
                    <div className="ops-section">
                      <div className="ops-section-title">📰 重點新聞</div>
                      {run.headlines.map((h, j) => (
                        <div key={j} className="ops-headline">• {h}</div>
                      ))}
                    </div>
                  )}

                  {run.focus?.length > 0 && (
                    <div className="ops-section">
                      <div className="ops-section-title">🎯 今日關注</div>
                      {run.focus.map((f, j) => (
                        <div key={j} className="ops-focus-item">• {f}</div>
                      ))}
                    </div>
                  )}

                  {run.analysis && (
                    <div className="ops-section">
                      <div className="ops-section-title">💡 睇法</div>
                      <div className="ops-analysis">{run.analysis}</div>
                    </div>
                  )}

                  {run.key_takeaways?.length > 0 && (
                    <div className="ops-takeaways">
                      {run.key_takeaways.map((t, j) => (
                        <div key={j} className="ops-takeaway">• {t}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!isSuccess && run.error && (
                <div className="ops-body">
                  <div className="ops-error-msg">{run.error}</div>
                </div>
              )}
            </div>
          )
        })}

        {sorted.length === 0 && (
          <div className="ops-empty">No pipeline runs recorded yet.</div>
        )}
      </div>

      <div className="footer">
        <span>🔹 Auto-updated after each pipeline run</span>
        <span className="deploy-badge">⚡ Live from GitHub</span>
      </div>

      <style jsx>{`
        .ops-summary {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        .ops-stat {
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 12px;
          padding: 16px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 120px;
        }
        .ops-num {
          font-size: 28px;
          font-weight: 700;
          color: #f1f5f9;
        }
        .ops-num.success { color: #10b981; }
        .ops-num.fail { color: #ef4444; }
        .ops-lbl {
          font-size: 12px;
          color: #94a3b8;
          margin-top: 4px;
        }
        .ops-timeline {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .ops-card {
          background: #1e293b;
          border: 1px solid #334155;
          border-left: 4px solid #888;
          border-radius: 12px;
          padding: 16px 20px;
          transition: border-color 0.2s;
        }
        .ops-card.ops-error {
          opacity: 0.85;
        }
        .ops-hd {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }
        .ops-icon {
          font-size: 24px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0f172a;
          border-radius: 10px;
        }
        .ops-info {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .ops-name {
          font-size: 16px;
          font-weight: 600;
          color: #f1f5f9;
        }
        .ops-meta {
          font-size: 12px;
          color: #94a3b8;
        }
        .ops-badge {
          font-size: 12px;
          padding: 4px 10px;
          border-radius: 6px;
          font-weight: 500;
        }
        .badge-ok {
          background: rgba(16,185,129,0.15);
          color: #10b981;
        }
        .badge-fail {
          background: rgba(239,68,68,0.15);
          color: #ef4444;
        }
        .ops-body {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .ops-direction {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }
        .ops-dir-label {
          color: #94a3b8;
          font-size: 12px;
        }
        .ops-dir-val {
          font-weight: 600;
        }
        .ops-metrics {
          display: flex;
          gap: 16px;
          font-size: 13px;
        }
        .ops-metric {
          color: #cbd5e1;
          font-family: 'SF Mono', 'Fira Code', monospace;
        }
        .ops-movers {
          font-size: 13px;
          line-height: 1.6;
        }
        .ops-gainers { color: #10b981; }
        .ops-losers { color: #ef4444; }
        .ops-takeaways {
          margin-top: 4px;
          padding-top: 8px;
          border-top: 1px solid #334155;
        }
        .ops-takeaway {
          font-size: 13px;
          color: #94a3b8;
          line-height: 1.5;
        }
        .ops-section {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid #334155;
        }
        .ops-section-title {
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          margin-bottom: 4px;
          letter-spacing: 0.5px;
        }
        .ops-headline {
          font-size: 13px;
          color: #cbd5e1;
          line-height: 1.5;
          padding: 1px 0;
        }
        .ops-focus-item {
          font-size: 13px;
          color: #fbbf24;
          line-height: 1.5;
          font-weight: 500;
          padding: 1px 0;
        }
        .ops-analysis {
          font-size: 13px;
          color: #a5b4fc;
          line-height: 1.5;
          font-style: italic;
        }
        .ops-error-msg {
          font-size: 13px;
          color: #fca5a5;
          font-family: 'SF Mono', 'Fira Code', monospace;
          white-space: pre-wrap;
        }
        .ops-empty {
          text-align: center;
          padding: 48px;
          color: #64748b;
          font-size: 14px;
        }
      `}</style>
    </div>
  )
}

export function getStaticProps() {
  return { props: { runs: runsData } }
}
