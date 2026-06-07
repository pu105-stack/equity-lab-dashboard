import { useState, useEffect } from 'react'

const pipelines = [
  { id: 'nc1', name: 'News Curator #1', icon: '📰', schedule: 'Mon–Fri 8pm', desc: '亞洲/歐洲 session news → 搵投資機會' },
  { id: 'nc2', name: 'News Curator #2', icon: '📰', schedule: 'Mon–Fri 8am', desc: 'US session news → 搵投資機會' },
  { id: 'ms', name: 'Morning Scan', icon: '🌅', schedule: 'Mon–Fri 8:30pm', desc: 'US pre-market context + macro setup' },
  { id: 'er', name: 'Evening Review', icon: '🌆', schedule: 'Mon–Fri 8:30am', desc: '收市 post-mortem + 機會追蹤' },
  { id: 'ws', name: 'Weekly Screen', icon: '📊', schedule: 'Sat 6am', desc: '7日 pipeline_reports + news_summary + .md → signal filter' },
  { id: 'dd', name: 'Deep Dive', icon: '🔬', schedule: 'Every 3h (12–21 HKT)', desc: 'On-demand ticker deep dive → DB + pipeline_reports w/embedding' },
]

const dbTables = [
  { name: 'pipeline_reports', rows: '13 (384-dim embedding)', desc: 'Morning/Evening/Deep Dive full analysis + vector', type: 'vector' },
  { name: 'news_summary', rows: '8,779', desc: 'News Curator 逐條 headline + sentiment', type: 'relational' },
  { name: 'weekly_screen', rows: '13', desc: '每週 ticker picks + 分類 + deep dive linkage', type: 'relational' },
  { name: 'deep_dive_results', rows: '6', desc: '8-phase deep dive: thesis, fair value, catalysts', type: 'relational' },
]

const techStack = [
  { cat: 'Data Ingestion', items: [
    { name: 'RSS Feeds', detail: '56 sources (Bloomberg, WSJ, CNBC, FT, etc.)' },
    { name: 'Yahoo Finance', detail: 'Prices, fundamentals, financials (yfinance)' },
    { name: 'FMP (Paid)', detail: 'Financials, key metrics, revenue segments, financial scores, earnings calendar' },
    { name: 'SEC EDGAR', detail: '8-K earnings press releases, XBRL financial facts, insider trades, 13F' },
    { name: 'TradingView', detail: 'Economic calendar API (actual/forecast/prior for CPI, NFP, FOMC, etc.)' },
    { name: 'Finnhub', detail: 'Real-time quotes, ticker news (250/day free)' },
    { name: 'FRED', detail: 'US macro data (GDP, CPI, yield curve)' },
    { name: 'Marketaux', detail: 'Entity-level sentiment news (100/day)' },
  ]},
  { cat: 'Orchestration', items: [
    { name: 'Hermes Agent', detail: 'AI agent framework — cron scheduler + tool calling + subagent delegation' },
    { name: 'DeepSeek V4', detail: 'LLM provider for all pipeline reasoning' },
    { name: 'fastembed', detail: 'bge-small-en-v1.5, 384-dim, runs in Docker' },
    { name: 'update-dashboard.py', detail: 'Post-pipeline handler — sync DB→JSON + git push' },
  ]},
  { cat: 'Storage', items: [
    { name: 'PostgreSQL + pgvector', detail: 'Docker container (equity-db), vector(384) support' },
    { name: 'daily-ops.json', detail: 'Flat file for dashboard display (git pushed)' },
    { name: 'deep-dive-decisions/results.json', detail: 'Display JSON synced from DB (git pushed)' },
    { name: '/docker-data/news-curator/', detail: 'News Curator markdown summaries (pipeline handoff)' },
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

function Section({ title, icon, children, defaultOpen = true, color = '#6366f1' }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="section">
      <button className="section-hd" onClick={() => setOpen(!open)} style={{ '--accent': color }}>
        <span className="section-hd-left">
          <span className="section-icon-wrap">{icon}</span>
          <span className="section-title">{title}</span>
        </span>
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
      <Section title="Pipeline Architecture" icon="🧭" color="#6366f1" defaultOpen={true}>
        <div className="arch-flow">
          {/* Data Sources Layer */}
          <div className="arch-layer">
            <div className="layer-label-wrapper">
              <span className="layer-line"></span>
              <span className="layer-label">Data Ingestion</span>
              <span className="layer-line"></span>
            </div>
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
                <span className="arch-icon">💵</span>
                <span className="arch-name">FMP</span>
                <span className="arch-detail">Financials · metrics · segments · scores</span>
              </div>
              <div className="arch-card src">
                <span className="arch-icon">📄</span>
                <span className="arch-name">SEC EDGAR</span>
                <span className="arch-detail">8-K earnings · XBRL facts · insider trades</span>
              </div>
              <div className="arch-card src">
                <span className="arch-icon">📅</span>
                <span className="arch-name">TradingView</span>
                <span className="arch-detail">Economic calendar API</span>
              </div>
              <div className="arch-card src">
                <span className="arch-icon">📈</span>
                <span className="arch-name">FRED</span>
                <span className="arch-detail">Macro data</span>
              </div>
              <div className="arch-card src">
                <span className="arch-icon">📊</span>
                <span className="arch-name">Marketaux</span>
                <span className="arch-detail">Entity-level sentiment</span>
              </div>
              <div className="arch-card pending">
                <span className="arch-icon">⏳</span>
                <span className="arch-name">Tiingo</span>
                <span className="arch-detail">News — overlaps with Marketaux + RSS</span>
              </div>
              <div className="arch-card pending">
                <span className="arch-icon">⏳</span>
                <span className="arch-name">Reddit</span>
                <span className="arch-detail">Sentiment — not wired yet</span>
              </div>
              <div className="arch-card pending">
                <span className="arch-icon">⏳</span>
                <span className="arch-name">Finviz</span>
                <span className="arch-detail">Screener — AI screening preferred</span>
              </div>
            </div>
          </div>

          <div className="arch-arrow-down">⬇</div>

          {/* Processing Layer */}
          <div className="arch-layer">
            <div className="layer-label-wrapper">
              <span className="layer-line"></span>
              <span className="layer-label">Pipeline Processing</span>
              <span className="layer-line"></span>
            </div>
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
            <div className="layer-label-wrapper">
              <span className="layer-line"></span>
              <span className="layer-label">Storage</span>
              <span className="layer-line"></span>
            </div>
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
            <div className="layer-label-wrapper">
              <span className="layer-line"></span>
              <span className="layer-label">Display</span>
              <span className="layer-line"></span>
            </div>
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
            </div>
          </div>
        </div>
      </Section>

      {/* Live Pipelines */}
      <Section title="Active Pipelines" icon="⏱️" color="#22c55e" defaultOpen={true}>
        <div className="pipeline-grid">
          {pipelines.map(p => (
            <div key={p.id} className={`pipeline-card ${p.id}`}>
              <div className="pipe-hd">
                <span className="pipe-icon">{p.icon}</span>
                <div className="pipe-meta">
                  <span className="pipe-name">{p.name}</span>
                  <span className="pipe-schedule">{p.schedule}</span>
                </div>
                <span className="pipe-status ok">
                  <StatusDot status="ok" />
                  Active
                </span>
              </div>
              <div className="pipe-body">
                <div className="pipe-desc">{p.desc}</div>
                <div className="pipe-tags">
                  <span className="pipe-tag">cron</span>
                  <span className="pipe-tag">{p.id === 'dd' ? 'delegate_task' : 'rss/yfinance'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Database Schema */}
      <Section title="Database Schema" icon="🗄️" color="#38bdf8" defaultOpen={false}>
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
      <Section title="Tech Stack" icon="🔧" color="#f59e0b" defaultOpen={false}>
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

      <style jsx global>{`
        .header-sub { font-size: 14px; color: #6b7280; margin-top: 4px; }
        .build-badge { font-size: 12px; padding: 4px 12px; border-radius: 8px; background: #1e293b; color: #94a3b8; border: 1px solid #334155; }

        /* Section */
        .section { background: #161b22; border: 1px solid #21262d; border-radius: 12px; margin-bottom: 20px; overflow: hidden; }
        .section-hd { display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 14px 20px; background: none; border: none; color: #f0f6fc; cursor: pointer; font-size: 15px; border-bottom: 1px solid transparent; position: relative; }
        .section-hd:hover { background: #1c2128; }
        .section-hd::before { content: ''; position: absolute; left: 0; top: 8px; bottom: 8px; width: 3px; border-radius: 0 3px 3px 0; background: var(--accent); opacity: 0.6; }
        .section-hd-left { display: flex; align-items: center; gap: 10px; }
        .section-icon-wrap { width: 28px; height: 28px; border-radius: 7px; display: flex; align-items: center; justify-content: center; font-size: 15px; }
        .section:nth-of-type(1) .section-icon-wrap { background: rgba(99,102,241,0.15); }
        .section:nth-of-type(2) .section-icon-wrap { background: rgba(34,197,94,0.15); }
        .section:nth-of-type(3) .section-icon-wrap { background: rgba(56,189,248,0.15); }
        .section:nth-of-type(4) .section-icon-wrap { background: rgba(245,158,11,0.15); }
        .section-title { font-size: 14px; font-weight: 600; color: #f0f6fc; }
        .section-arrow { transition: transform 0.2s; display: flex; color: var(--accent); opacity: 0.5; }
        .section-arrow.open { transform: rotate(180deg); }
        .section-body { padding: 0 20px 20px; }

        /* Architecture Flow */
        .arch-flow { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 20px 0; }
        .arch-layer { display: flex; flex-direction: column; align-items: center; gap: 10px; width: 100%; }
        .arch-layer .layer-label-wrapper { display: flex; align-items: center; gap: 12px; width: 100%; margin-bottom: 4px; }
        .arch-layer .layer-line { flex: 1; height: 1px; background: linear-gradient(to right, transparent, #1e293b, transparent); }
        .layer-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; padding: 4px 14px; border-radius: 20px; white-space: nowrap; }
        .arch-layer:nth-of-type(1) .layer-label { background: rgba(59,130,246,0.12); color: #60a5fa; }
        .arch-layer:nth-of-type(3) .layer-label { background: rgba(168,85,247,0.12); color: #a78bfa; }
        .arch-layer:nth-of-type(5) .layer-label { background: rgba(56,189,248,0.12); color: #38bdf8; }
        .arch-layer:nth-of-type(7) .layer-label { background: rgba(167,139,250,0.12); color: #a78bfa; }
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
        .pipeline-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 10px; padding: 0; position: relative; overflow: hidden; display: flex; flex-direction: column; }
        .pipeline-card::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; }
        .pipeline-card.nc::before { background: #3b82f6; }
        .pipeline-card.ms::before { background: #22c55e; }
        .pipeline-card.er::before { background: #f59e0b; }
        .pipeline-card.ws::before { background: #a855f7; }
        .pipeline-card.dd::before { background: #ec4899; }
        .pipe-hd { display: flex; align-items: center; gap: 12px; padding: 14px 16px 0; }
        .pipe-icon { width: 36px; height: 36px; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 17px; flex-shrink: 0; }
        .pipeline-card.nc .pipe-icon { background: rgba(59,130,246,0.15); color: #3b82f6; }
        .pipeline-card.ms .pipe-icon { background: rgba(34,197,94,0.15); color: #22c55e; }
        .pipeline-card.er .pipe-icon { background: rgba(245,158,11,0.15); color: #f59e0b; }
        .pipeline-card.ws .pipe-icon { background: rgba(168,85,247,0.15); color: #a855f7; }
        .pipeline-card.dd .pipe-icon { background: rgba(236,72,153,0.15); color: #ec4899; }
        .pipe-meta { flex: 1; display: flex; flex-direction: column; gap: 2px; }
        .pipe-name { font-size: 14px; font-weight: 600; color: #f0f6fc; }
        .pipe-schedule { font-size: 11px; color: #6b7280; }
        .pipe-status { display: flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 500; padding: 3px 10px; border-radius: 20px; }
        .pipe-status.ok { color: #4ade80; background: rgba(74,222,128,0.1); border: 1px solid rgba(74,222,128,0.15); }
        .pipe-body { padding: 10px 16px 14px; }
        .pipe-desc { font-size: 13px; color: #9ca3af; line-height: 1.5; }
        .pipe-tags { display: flex; gap: 6px; margin-top: 10px; }
        .pipe-tag { font-size: 10px; padding: 2px 8px; border-radius: 4px; background: #1c2128; color: #6b7280; font-weight: 500; }

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
/* System Overview v2 */
