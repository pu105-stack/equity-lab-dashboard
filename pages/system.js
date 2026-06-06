import { useState, useEffect } from 'react'

const pipelines = [
  { id: 'nc1', name: 'News Curator #1', icon: '📰', schedule: 'Mon–Fri 8pm', desc: '亞洲/歐洲 session news → 搵投資機會', color: '#3b82f6' },
  { id: 'nc2', name: 'News Curator #2', icon: '📰', schedule: 'Mon–Fri 8am', desc: 'US session news → 搵投資機會', color: '#3b82f6' },
  { id: 'ms', name: 'Morning Scan', icon: '🌅', schedule: 'Mon–Fri 8:30pm', desc: 'US pre-market context + macro setup', color: '#22c55e' },
  { id: 'er', name: 'Evening Review', icon: '🌆', schedule: 'Mon–Fri 8:30am', desc: '收市 post-mortem + 機會追蹤', color: '#f59e0b' },
  { id: 'ws', name: 'Weekly Screen', icon: '📊', schedule: 'Sat 6am', desc: '7日 News Curator 分析 → signal filter', color: '#a855f7' },
  { id: 'dd', name: 'Deep Dive', icon: '🔬', schedule: 'Every 3h (9–18 HKT)', desc: 'On-demand ticker deep dive analysis', color: '#ec4899' },
]

const dbTables = [
  { name: 'pipeline_reports', rows: '13 (385-dim embedding)', desc: '所有 pipeline 嘅 full analysis text', type: 'vector' },
  { name: 'news_summary', rows: '8,767', desc: 'News Curator 逐條 headline + sentiment', type: 'relational' },
  { name: 'weekly_screen', rows: '~30', desc: '每週 ticker picks + 分類 + deep dive linkage', type: 'relational' },
  { name: 'deep_dive_results', rows: '3', desc: '8-phase deep dive: thesis, fair value, catalysts', type: 'relational' },
]

const techStack = [
  { cat: 'Data Ingestion', items: [
    { name: 'RSS Feeds', detail: '56 sources (Bloomberg, WSJ, CNBC, FT, etc.)' },
    { name: 'Yahoo Finance', detail: 'Prices, fundamentals, financials (yfinance)' },
    { name: 'Finnhub', detail: 'Real-time quotes, ticker news (250/day free)' },
    { name: 'FRED', detail: 'US macro data (GDP, CPI, yield curve)' },
    { name: 'Marketaux', detail: 'Entity-level sentiment news (100/day)' },
  ]},
  { cat: 'Orchestration', items: [
    { name: 'Hermes Agent', detail: 'AI agent framework — cron scheduler + tool calling + subagent delegation' },
    { name: 'DeepSeek V4', detail: 'LLM provider for all pipeline reasoning' },
    { name: 'fastembed', detail: 'bge-small-en-v1.5, 384-dim, runs in Docker' },
  ]},
  { cat: 'Storage', items: [
    { name: 'PostgreSQL + pgvector', detail: 'Docker container (equity-db), vector(384) support' },
    { name: 'daily-ops.json', detail: 'Flat file for dashboard display (git pushed)' },
  ]},
  { cat: 'Display', items: [
    { name: 'Vercel (Next.js)', detail: 'Static dashboard hosting, auto-deploy from GitHub' },
    { name: 'Discord', detail: 'Cron delivery target (Oscar DM)' },
  ]},
]

function StatusDot({ status }) {
  return <span className={`sd sd-${status}`} />
}

function ArrowRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
      <path d="M3 10h12M11 5l5 5-5 5" stroke="#4b5563" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function ChevronDown() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 6l4 4 4-4" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function Section({ title, icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="section">
      <button className="section-hd" onClick={() => setOpen(!open)}>
        <span className="section-title">{icon} {title}</span>
        <span className={`section-arrow ${open ? 'open' : ''}`}><ChevronDown /></span>
      </button>
      {open && <div className="section-body">{children}</div>}
    </div>
  )
}

export default function System() {
  return (
    <div className="container">

      {/* Header */}
      <div className="header">
        <div>
          <h1>⚙️ System Overview</h1>
          <p className="header-sub">Equity Lab — AI-Powered Investment Analysis Pipeline</p>
        </div>
        <span className="build-badge">v2.0 · Jun 2026</span>
      </div>

      {/* Architecture Flow */}
      <Section title="Pipeline Architecture" icon="🧭" defaultOpen={true}>
        <div className="arch-flow">
          {/* Data Sources Layer */}
          <div className="arch-layer">
            <div className="layer-label">Data Ingestion</div>
            <div className="layer-cards">
              <div className="arch-card src">
                <span className="arch-icon">📡</span>
                <span className="arch-name">RSS Feeds</span>
                <span className="arch-detail">56 sources</span>
              </div>
              <div className="arch-card src">
                <span className="arch-icon">💹</span>
                <span className="arch-name">Yahoo Finance</span>
                <span className="arch-detail">Prices + fundamentals</span>
              </div>
              <div className="arch-card src">
                <span className="arch-icon">🔍</span>
                <span className="arch-name">Finnhub</span>
                <span className="arch-detail">Real-time quotes</span>
              </div>
              <div className="arch-card src">
                <span className="arch-icon">📈</span>
                <span className="arch-name">FRED</span>
                <span className="arch-detail">Macro data</span>
              </div>
            </div>
          </div>

          <div className="arch-arrow-down">⬇</div>

          {/* Processing Layer */}
          <div className="arch-layer">
            <div className="layer-label">Pipeline Processing</div>
            <div className="layer-cards">
              <div className="arch-card proc nc">
                <span className="arch-icon">📰</span>
                <span className="arch-name">News Curator</span>
                <span className="arch-detail">2x daily · AI curation</span>
              </div>
              <div className="arch-card proc ms">
                <span className="arch-icon">🌅</span>
                <span className="arch-name">Morning Scan</span>
                <span className="arch-detail">8:30pm · Pre-market</span>
              </div>
              <div className="arch-card proc er">
                <span className="arch-icon">🌆</span>
                <span className="arch-name">Evening Review</span>
                <span className="arch-detail">8:30am · Post-mortem</span>
              </div>
              <div className="arch-card proc ws">
                <span className="arch-icon">📊</span>
                <span className="arch-name">Weekly Screen</span>
                <span className="arch-detail">Sat · Signal filter</span>
              </div>
              <div className="arch-card proc dd">
                <span className="arch-icon">🔬</span>
                <span className="arch-name">Deep Dive</span>
                <span className="arch-detail">On-demand · 8-phase</span>
              </div>
            </div>
          </div>

          <div className="arch-arrow-down">⬇</div>

          {/* Storage Layer */}
          <div className="arch-layer">
            <div className="layer-label">Storage</div>
            <div className="layer-cards">
              <div className="arch-card db">
                <span className="arch-icon">🗄️</span>
                <span className="arch-name">PostgreSQL + pgvector</span>
                <span className="arch-detail">Docker · pipeline_reports + news_summary + weekly_screen + deep_dive_results</span>
              </div>
              <div className="arch-card db">
                <span className="arch-icon">📄</span>
                <span className="arch-name">daily-ops.json</span>
                <span className="arch-detail">Git pushed · Vercel display</span>
              </div>
            </div>
          </div>

          <div className="arch-arrow-down">⬇</div>

          {/* Display Layer */}
          <div className="arch-layer">
            <div className="layer-label">Display</div>
            <div className="layer-cards">
              <div className="arch-card display">
                <span className="arch-icon">🖥️</span>
                <span className="arch-name">Dashboard</span>
                <span className="arch-detail">Vercel · oscary.space</span>
              </div>
              <div className="arch-card display">
                <span className="arch-icon">💬</span>
                <span className="arch-name">Discord DM</span>
                <span className="arch-detail">Cron delivery</span>
              </div>
              <div className="arch-card display">
                <span className="arch-icon">🔎</span>
                <span className="arch-name">RAG Search</span>
                <span className="arch-detail">Keyword + full-text</span>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Live Pipelines */}
      <Section title="Active Pipelines" icon="⏱️" defaultOpen={true}>
        <div className="pipeline-grid">
          {pipelines.map(p => (
            <div key={p.id} className={`pipeline-card ${p.id}`}>
              <div className="pipe-hd">
                <span className="pipe-icon" style={{ background: p.color + '20', color: p.color }}>{p.icon}</span>
                <div className="pipe-meta">
                  <span className="pipe-name">{p.name}</span>
                  <span className="pipe-schedule">{p.schedule}</span>
                </div>
                <span className="pipe-status ok">
                  <StatusDot status="ok" />
                  Active
                </span>
              </div>
              <div className="pipe-desc">{p.desc}</div>
              <div className="pipe-tags">
                <span className="pipe-tag">cron</span>
                <span className="pipe-tag">{p.id === 'dd' ? 'delegate_task' : 'rss/yfinance'}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Database Schema */}
      <Section title="Database Schema" icon="🗄️" defaultOpen={false}>
        <div className="db-grid">
          {dbTables.map(t => (
            <div key={t.name} className="db-card">
              <div className="db-hd">
                <span className="db-name">{t.name}</span>
                <span className={`db-type ${t.type}`}>{t.type === 'vector' ? '📐 vector' : '📋 relational'}</span>
              </div>
              <div className="db-rows">{t.rows}</div>
              <div className="db-desc">{t.desc}</div>
            </div>
          ))}
        </div>
        <div className="db-schema-block">
          <pre className="schema-sql">{`pipeline_reports (id, pipeline, date, content, ticker, embedding VECTOR(384), created_at)
    ↑
weekly_screen (id, screen_date, ticker, category, deep_dive_status, done_at)
    ↑ FK (weekly_screen_id)
deep_dive_results (id, weekly_screen_id, ticker, decision, conviction, verdict,
                   full_analysis, fair_value, upside_pct, key_catalysts TEXT[], completed_at)

news_summary (id, title, source, published_at, tickers, sentiment_score, url, created_at)`}</pre>
        </div>
      </Section>

      {/* Tech Stack */}
      <Section title="Tech Stack" icon="🔧" defaultOpen={false}>
        <div className="tech-grid">
          {techStack.map(cat => (
            <div key={cat.cat} className="tech-cat">
              <div className="tech-cat-title">{cat.cat}</div>
              {cat.items.map(item => (
                <div key={item.name} className="tech-item">
                  <span className="tech-name">{item.name}</span>
                  <span className="tech-detail">{item.detail}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Section>

      <div className="footer">
        <span>🔹 Equity Lab — AI-Powered Decision Support System</span>
        <span className="deploy-badge">⚡ v2.0 · 2026-06</span>
      </div>

      <style jsx>{`
        .header-sub { font-size: 14px; color: #6b7280; margin-top: 4px; }
        .build-badge { font-size: 12px; padding: 4px 12px; border-radius: 8px; background: #1e293b; color: #94a3b8; border: 1px solid #334155; }

        /* Section */
        .section { background: #161b22; border: 1px solid #21262d; border-radius: 12px; margin-bottom: 20px; overflow: hidden; }
        .section-hd { display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 16px 20px; background: none; border: none; color: #f0f6fc; cursor: pointer; font-size: 15px; }
        .section-hd:hover { background: #1c2128; }
        .section-title { font-size: 15px; font-weight: 600; }
        .section-arrow { transition: transform 0.2s; display: flex; }
        .section-arrow.open { transform: rotate(180deg); }
        .section-body { padding: 0 20px 20px; }

        /* Architecture Flow */
        .arch-flow { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 20px 0; }
        .arch-layer { display: flex; flex-direction: column; align-items: center; gap: 10px; width: 100%; }
        .layer-label { font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; }
        .layer-cards { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
        .arch-card { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 14px 16px; border-radius: 10px; border: 1px solid; min-width: 120px; text-align: center; }
        .arch-card.src { background: #0f172a; border-color: #1e3a5f; }
        .arch-card.src .arch-name { color: #60a5fa; }
        .arch-card.proc.nc { background: #1e1b4b; border-color: #3b1f6e; }
        .arch-card.proc.ms { background: #052e16; border-color: #166534; }
        .arch-card.proc.er { background: #1c1917; border-color: #713f12; }
        .arch-card.proc.ws { background: #1a0e2e; border-color: #581c87; }
        .arch-card.proc.dd { background: #1c0e1e; border-color: #831843; }
        .arch-card.db { background: #0c1929; border-color: #1e3a5f; }
        .arch-card.db .arch-name { color: #38bdf8; }
        .arch-card.display { background: #0f172a; border-color: #334155; }
        .arch-card.display .arch-name { color: #a78bfa; }
        .arch-icon { font-size: 22px; }
        .arch-name { font-size: 13px; font-weight: 600; color: #f0f6fc; }
        .arch-detail { font-size: 11px; color: #6b7280; }
        .arch-proc-card .arch-name { color: #f0f6fc; }
        .arch-arrow-down { font-size: 18px; color: #4b5563; line-height: 1; }

        /* Pipeline Status Grid */
        .pipeline-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 8px 0; }
        @media (max-width: 768px) { .pipeline-grid { grid-template-columns: 1fr; } }
        .pipeline-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 10px; padding: 14px; }
        .pipe-hd { display: flex; align-items: center; gap: 10px; }
        .pipe-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
        .pipe-meta { flex: 1; display: flex; flex-direction: column; gap: 1px; }
        .pipe-name { font-size: 14px; font-weight: 600; color: #f0f6fc; }
        .pipe-schedule { font-size: 11px; color: #6b7280; }
        .pipe-status { display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 6px; }
        .pipe-status.ok { color: #4ade80; background: rgba(74,222,128,0.1); }
        .pipe-desc { font-size: 13px; color: #9ca3af; margin-top: 10px; padding-left: 2px; }
        .pipe-tags { display: flex; gap: 6px; margin-top: 10px; }
        .pipe-tag { font-size: 10px; padding: 2px 8px; border-radius: 4px; background: #1e293b; color: #64748b; }

        /* Status Dot */
        .sd { display: inline-block; width: 7px; height: 7px; border-radius: 50%; }
        .sd-ok { background: #4ade80; box-shadow: 0 0 6px rgba(74,222,128,0.4); }

        /* Database Cards */
        .db-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 8px 0; }
        @media (max-width: 640px) { .db-grid { grid-template-columns: 1fr; } }
        .db-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 10px; padding: 14px; }
        .db-hd { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
        .db-name { font-size: 14px; font-weight: 700; color: #f0f6fc; font-family: 'SF Mono', 'Fira Code', monospace; }
        .db-type { font-size: 10px; padding: 2px 8px; border-radius: 4px; }
        .db-type.vector { background: rgba(56,189,248,0.1); color: #38bdf8; }
        .db-type.relational { background: rgba(168,85,247,0.1); color: #a855f7; }
        .db-rows { font-size: 20px; font-weight: 700; color: #f0f6fc; }
        .db-desc { font-size: 12px; color: #6b7280; margin-top: 4px; }
        .db-schema-block { margin-top: 16px; }
        .schema-sql { background: #0f172a; border: 1px solid #1e293b; border-radius: 8px; padding: 16px; font-size: 12px; line-height: 1.7; color: #94a3b8; overflow-x: auto; white-space: pre; font-family: 'SF Mono', 'Fira Code', monospace; }

        /* Tech Stack */
        .tech-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 8px 0; }
        @media (max-width: 768px) { .tech-grid { grid-template-columns: 1fr; } }
        .tech-cat { background: #0f172a; border: 1px solid #1e293b; border-radius: 10px; padding: 14px; }
        .tech-cat-title { font-size: 12px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
        .tech-item { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #1c2128; }
        .tech-item:last-child { border-bottom: none; }
        .tech-name { font-size: 13px; font-weight: 600; color: #f0f6fc; }
        .tech-detail { font-size: 11px; color: #6b7280; text-align: right; max-width: 55%; }
      `}</style>
    </div>
  )
}
