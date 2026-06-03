import { useState } from 'react'
import runsData from '../data/daily-ops.json'

const PIPELINE_META = {
  '開市前掃瞄': { icon: '🌅', color: '#f59e0b', desc: 'Pre-market context' },
  '美股收市回顧': { icon: '🌆', color: '#6366f1', desc: 'Close review & lessons' },
  '每週篩選': { icon: '📊', color: '#10b981', desc: 'Weekly screening' },
  '新聞分析-NewsCurator': { icon: '📰', color: '#ec4899', desc: 'News → opportunities' },
}

const FIELD_META = {
  market_direction: { icon: '🎯', label: 'Direction' },
  spy: { icon: '📈', label: 'SPY' },
  vix: { icon: '📉', label: 'VIX' },
  top_gainers: { icon: '🟢', label: 'Gainers' },
  top_losers: { icon: '🔴', label: 'Losers' },
  opportunities: { icon: '🎯', label: 'Opportunities' },
  risks: { icon: '⚠️', label: 'Risks' },
  my_take: { icon: '🧠', label: 'Analyst Take' },
  headlines: { icon: '📰', label: 'Headlines' },
  focus: { icon: '👁️', label: 'Focus' },
  analysis: { icon: '💡', label: 'Analysis' },
  key_takeaways: { icon: '📌', label: 'Key Takeaways' },
}

function OpsCard({ run, meta, isOpen, onToggle }) {
  const isSuccess = run.status === 'success'

  const renderField = (key, value) => {
    const fm = FIELD_META[key] || { icon: '•', label: key }
    if (!value || (Array.isArray(value) && value.length === 0)) return null

    if (key === 'top_gainers' || key === 'top_losers') {
      const cls = key === 'top_gainers' ? 'ops-gainers' : 'ops-losers'
      return (
        <div className="ops-field" key={key}>
          <span className="ops-field-label">{fm.icon} {fm.label}</span>
          <div className="ops-field-body">
            <span className={cls}>{value.join(' · ')}</span>
          </div>
        </div>
      )
    }

    if (key === 'opportunities' || key === 'risks' || key === 'headlines' || key === 'focus' || key === 'key_takeaways') {
      return (
        <div className="ops-field" key={key}>
          <span className="ops-field-label">{fm.icon} {fm.label}</span>
          <div className="ops-field-body">
            {value.map((item, i) => (
              <div key={i} className="ops-list-item">• {item}</div>
            ))}
          </div>
        </div>
      )
    }

    if (key === 'my_take' || key === 'analysis') {
      return (
        <div className="ops-field" key={key}>
          <span className="ops-field-label">{fm.icon} {fm.label}</span>
          <div className="ops-field-body">
            <div className="ops-take">{value}</div>
          </div>
        </div>
      )
    }

    // Simple fields (spy, vix, market_direction)
    return (
      <div className="ops-field" key={key}>
        <span className="ops-field-label">{fm.icon} {fm.label}</span>
        <div className="ops-field-body">
          <span className="ops-metric">{value}</span>
        </div>
      </div>
    )
  }

  // Fields to display (in order)
  const fields = run.pipeline === '新聞分析-NewsCurator'
    ? ['market_direction', 'opportunities', 'risks', 'my_take']
    : ['market_direction', 'spy', 'vix', 'top_gainers', 'top_losers', 'headlines', 'focus', 'analysis', 'key_takeaways']

  return (
    <div
      className={`ops-card ${isSuccess ? '' : 'ops-error'} ${isOpen ? 'ops-open' : ''}`}
      style={{ borderLeftColor: meta.color }}
    >
      {/* Clickable header — always visible */}
      <div className="ops-hd" onClick={onToggle} role="button" tabIndex={0}>
        <span className="ops-icon" style={{ background: `${meta.color}15`, color: meta.color }}>{meta.icon}</span>
        <div className="ops-info">
          <span className="ops-name">{run.pipeline}</span>
          <span className="ops-meta">{run.date} · {run.time} {isOpen ? '▲' : '▼'}</span>
        </div>
        <span className={`ops-badge ${isSuccess ? 'badge-ok' : 'badge-fail'}`}>
          {isSuccess ? '✅ Success' : '❌ Failed'}
        </span>
      </div>

      {/* Accordion body — shown only when open */}
      {isOpen && (
        <div className="ops-body">
          {isSuccess ? (
            <div className="ops-fields">
              {fields.map(f => renderField(f, run[f]))}
            </div>
          ) : (
            <div className="ops-error-msg">{run.error || 'Unknown error'}</div>
          )}
        </div>
      )}
    </div>
  )
}

export default function DailyOps({ runs }) {
  const [openIndex, setOpenIndex] = useState(null)
  const sorted = [...runs.runs].sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`))

  const toggleCard = (i) => {
    setOpenIndex(openIndex === i ? null : i)
  }

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
        <div className="ops-stat">
          <span className="ops-num">{Object.keys(PIPELINE_META).length}</span>
          <span className="ops-lbl">📡 Pipelines</span>
        </div>
      </div>

      {/* Pipeline legend */}
      <div className="ops-legend">
        {Object.entries(PIPELINE_META).map(([name, m]) => (
          <div key={name} className="ops-legend-item">
            <span className="ops-legend-dot" style={{ background: m.color }}></span>
            <span className="ops-legend-name">{m.icon} {name}</span>
            <span className="ops-legend-desc">{m.desc}</span>
          </div>
        ))}
      </div>

      {/* Timeline — accordion */}
      <div className="ops-timeline">
        {sorted.map((run, i) => {
          const meta = PIPELINE_META[run.pipeline] || { icon: '📡', color: '#888', desc: '' }
          return (
            <OpsCard
              key={`${run.date}-${run.pipeline}-${i}`}
              run={run}
              meta={meta}
              isOpen={openIndex === i}
              onToggle={() => toggleCard(i)}
            />
          )
        })}
        {sorted.length === 0 && (
          <div className="ops-empty">No pipeline runs recorded yet.</div>
        )}
      </div>

      <div className="footer">
        <span>🔹 Click any run to expand/collapse details</span>
        <span className="deploy-badge">⚡ Live from GitHub</span>
      </div>

      <style jsx>{`
        .ops-summary {
          display: flex;
          gap: 16px;
          margin-bottom: 20px;
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

        /* Legend */
        .ops-legend {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .ops-legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 8px;
          font-size: 12px;
        }
        .ops-legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .ops-legend-name {
          font-weight: 600;
          color: #e2e8f0;
        }
        .ops-legend-desc {
          color: #94a3b8;
          font-size: 11px;
        }

        .ops-timeline {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        /* Card */
        .ops-card {
          background: #1e293b;
          border: 1px solid #334155;
          border-left: 4px solid #888;
          border-radius: 12px;
          overflow: hidden;
          transition: border-color 0.2s;
        }
        .ops-card.ops-error { opacity: 0.85; }

        /* Header — clickable */
        .ops-hd {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 20px;
          cursor: pointer;
          user-select: none;
          transition: background 0.15s;
        }
        .ops-hd:hover { background: rgba(255,255,255,0.03); }
        .ops-card.ops-open .ops-hd {
          border-bottom: 1px solid #334155;
        }

        .ops-icon {
          font-size: 22px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          flex-shrink: 0;
        }
        .ops-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .ops-name {
          font-size: 16px;
          font-weight: 600;
          color: #f1f5f9;
        }
        .ops-meta {
          font-size: 12px;
          color: #64748b;
        }
        .ops-badge {
          font-size: 12px;
          padding: 4px 10px;
          border-radius: 6px;
          font-weight: 500;
          flex-shrink: 0;
        }
        .badge-ok {
          background: rgba(16,185,129,0.15);
          color: #10b981;
        }
        .badge-fail {
          background: rgba(239,68,68,0.15);
          color: #ef4444;
        }

        /* Body */
        .ops-body {
          padding: 16px 20px;
        }
        .ops-fields {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .ops-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .ops-field-label {
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .ops-field-body {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .ops-list-item {
          font-size: 13px;
          color: #cbd5e1;
          line-height: 1.5;
          padding: 1px 0;
        }
        .ops-metric {
          font-size: 14px;
          font-weight: 600;
          color: #e2e8f0;
          font-family: 'SF Mono', 'Fira Code', monospace;
        }
        .ops-gainers { color: #10b981; font-size: 13px; }
        .ops-losers { color: #ef4444; font-size: 13px; }
        .ops-take {
          font-size: 13px;
          color: #a5b4fc;
          line-height: 1.6;
          font-style: italic;
          white-space: pre-wrap;
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
