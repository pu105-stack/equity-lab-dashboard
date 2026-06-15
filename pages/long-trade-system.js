import { useState, useEffect } from 'react'

const processes = [
  {
    name: 'Data Ingestion',
    icon: '📡',
    items: [
      { icon: '🔬', label: 'Deep Dive Results', detail: 'Maya 嘅 BUY/WATCH/PASS verdict → 決定 trade or pass' },
      { icon: '💹', label: 'FMP Quote', detail: 'Real-time 現價 check（entry price、SL 距離）' },
      { icon: '📅', label: 'Economic Calendar', detail: 'Earnings / CPI / FOMC — timing 風險 check' },
      { icon: '🗄️', label: 'Portfolio Monitor', detail: 'Open positions + sector exposure + P&L' },
      { icon: '📊', label: 'Weekly Screen', detail: '13 candidates 每週更新 → deep dive candidate' },
      { icon: '📰', label: 'News Curator', detail: 'News summaries + sentiment for macro context' },
    ],
    color: '#3b82f6',
  },
  {
    name: 'Decision Logic',
    icon: '🧠',
    items: [
      { icon: '✅', label: 'Deep Dive Check', detail: 'Verdict = BUY? 基本面 OK? Fair value 有 upside?' },
      { icon: '💰', label: 'Price Check', detail: '現價 vs fair value → 入場時機合理?' },
      { icon: '📋', label: '12-Item Pre-Trade Checklist', detail: 'pre-trade-check.py — 逐一驗證，One fail = PASS (唔入)' },
      { icon: '⚖️', label: 'Position Sizing', detail: 'Kelly × 25% × VIX adjustment — max 15% per position' },
      { icon: '🎯', label: 'R/R Calculation', detail: 'SL = 2×ATR(14), TP = 3×SL, R/R ≥ 1:2 先入場' },
      { icon: '🛡️', label: 'Portfolio Check', detail: 'Sector < 30%? Position > 15%→alert. Open ≤ 5 trades' },
    ],
    color: '#a855f7',
  },
  {
    name: 'Execution',
    icon: '⚡',
    items: [
      { icon: '🗣️', label: 'Proposal to Oscar', detail: 'Format: trade-proposal-format.md → Oscar: buy / size X / cancel' },
      { icon: '📝', label: 'Trade Journal', detail: 'journal.py — 每單 trade 完寫反思 + 評分' },
      { icon: '📈', label: 'Position Monitor', detail: 'P&L tracking, SL/TP 距離 alert, trailing stop' },
      { icon: '🔍', label: 'Market Open Gap Check', detail: '21:30/22:30 HKT — 睇 overnight gap 有冇 breach SL/TP' },
      { icon: '🆕', label: 'Mid-Week Checkpoint', detail: 'Wed 21:00 — re-check Sat fails + new BUY scan' },
      { icon: '📊', label: 'Weekly Review', detail: 'Sat 10am — Performance + Positions + Pipeline review' },
      { icon: '📑', label: 'Monthly Review', detail: '1st Sat — P&L vs SPY + Attribution + Risk + Journal' },
    ],
    color: '#22c55e',
  },
]

const schedules = [
  { time: '09:30 HKT', playbook: 'morning', what: '☀️ Morning Check: Evening Review recap + open positions + P&L + risk metrics + economic calendar + MTM snapshot', type: 'auto' },
  { time: '21:00 HKT', playbook: 'premarket', what: '🌅 Premarket Check: Positions + BUY scan from Deep Dive + live prices + event risk (FOMC/earnings)', type: 'auto' },
  { time: 'Wed 21:00 HKT', playbook: 'mid-week', what: '🆕 Mid-Week Checkpoint: Re-check Sat FAIL candidates with current prices + new BUY scan + quick SL/TP alert', type: 'auto' },
  { time: 'Sat 10:00 HKT', playbook: 'weekly', what: '📈 Weekly Review 🔑: Performance + positions + pre-trade-check on ALL BUY/WATCH → trade proposals', type: 'auto' },
  { time: '1st Sat 11:00 HKT', playbook: 'monthly', what: '📊 Monthly Review: P&L vs SPY + attribution analysis + risk metrics + trade journal review', type: 'auto' },
  { time: '~21:30/22:30 HKT', playbook: 'gap-check', what: '🔍 Market Open Gap Check: Overnight gap breach SL/TP? Alert Oscar if triggered', type: 'manual' },
  { time: 'Ad-hoc', playbook: 'pre-trade-check', what: '🔍 Pre-Trade: BUY candidate → 12-item checklist → position-size.py → propose to Oscar', type: 'manual' },
  { time: 'Ad-hoc', playbook: 'request-deep-dive', what: '🔬 Request Maya: Anya spots candidate → request-deep-dive.py → Maya picks up next poll', type: 'manual' },
  { time: 'Ad-hoc', playbook: 'journal', what: '📝 Trade Reflection: Trade closed → journal.py write reflection', type: 'manual' },
]

const riskRules = [
  { rule: 'Max Loss / Trade', value: '-8% (SL = 2×ATR floor)' },
  { rule: 'Max Daily Loss', value: '-4% of portfolio → stop trading' },
  { rule: 'Max Weekly Loss', value: '-8% of portfolio → full review' },
  { rule: 'Max Monthly Loss', value: '-15% of portfolio → strategy review' },
  { rule: 'Max Open Positions', value: '5' },
  { rule: 'Max Sector Concentration', value: '30% of portfolio' },
  { rule: 'Max Position Size', value: '15% of portfolio' },
  { rule: 'Max Daily Trades', value: '3 (wait till tomorrow)' },
  { rule: 'Min R/R Ratio', value: '1:2 (≥ 2:1)' },
  { rule: 'Position Sizing', value: 'Kelly × 25% × VIX adjustment' },
]

const dbTables = [
  { name: 'trades', desc: 'All trade records (trader=anya)', type: 'relational' },
  { name: 'account', desc: 'Cash + equity balance', type: 'relational' },
  { name: 'account_snapshots', desc: 'Daily portfolio snapshots (total_value, cash, positions, daily_pnl)', type: 'relational' },
  { name: 'anya_logs', desc: 'Checkpoint run index', type: 'relational' },
  { name: 'deep_dive_requests', desc: 'Anya → Maya: request deep dive', type: 'relational' },
  { name: 'deep_dive_results', desc: 'Maya: BUY/WATCH/PASS decisions', type: 'relational' },
  { name: 'weekly_screen', desc: '13 candidates → deep dive pipeline', type: 'relational' },
]

const scripts = [
  { name: 'daily-check.py --playbook morning', when: 'Cron 09:30', what: 'Full morning briefing: positions + P&L + risk + calendar + Evening Review recap' },
  { name: 'daily-check.py --playbook premarket', when: 'Cron 21:00', what: 'Pre-market prep: BUY scan + live price + event risk' },
  { name: 'daily-check.py --playbook mid-week', when: 'Cron Wed 21:00', what: 'Mid-week: re-check Sat fails + new BUY scan + SL/TP alert' },
  { name: 'daily-check.py --playbook weekly', when: 'Cron Sat 10:00', what: 'Weekly performance + positions + pipeline + pre-trade on BUY/WATCH + proposals' },
  { name: 'daily-check.py --playbook monthly', when: 'Cron 1st Sat 11:00', what: 'Monthly P&L vs SPY + attribution + risk + journal' },
  { name: 'pre-trade-check.py TICKER LONG PRICE', when: 'Manual (BUY found)', what: '12-item checklist — ALL must PASS, one fail = no trade' },
  { name: 'position-size.py TICKER PRICE --source X', when: 'Manual (checklist pass)', what: 'Kelly formula × 25% × VIX adjustment' },
  { name: 'request-deep-dive.py TICKER "reason"', when: 'Manual (candidate spotted)', what: 'Request Maya for deep dive analysis via deep_dive_requests table' },
  { name: 'journal.py TRADE_ID "reflection"', when: 'Manual (trade closed)', what: 'Write trade reflection to journal' },
  { name: 'trades_db.py trader=anya open/close ...', when: 'Manual (Oscar confirmed)', what: 'Execute/open or close a trade after Oscar confirmation' },
]

const coreRules = [
  { icon: '⛔', rule: 'Never execute without Oscar confirmation' },
  { icon: '💡', rule: 'Pass = 唔輸錢 — one checklist fail = no trade, no exceptions' },
  { icon: '📋', rule: 'All proposals follow trade-proposal-format.md (OPEN + CLOSE sections)' },
  { icon: '📁', rule: 'All output auto-saved to /docker-data/anya/{checkpoint}-review/ + DB index' },
  { icon: '🤝', rule: 'Anya → Maya via deep_dive_requests table (delegation)' },
  { icon: '🧠', rule: 'Anya decides, Oscar confirms — never ask Oscar "which one?"' },
  { icon: '📊', rule: 'DB = source of truth, JSON = display layer' },
  { icon: '🔄', rule: 'update-dashboard.py --sync-only post-pipeline for git push' },
]

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

export default function LongTradeSystem() {
  return (
    <div className="container">

      {/* Header */}
      <div className="header">
        <div>
          <h1>📈 Long Trade System</h1>
          <p className="header-sub">Anya — Professional Position Trader · US Equities · Days〜Weeks</p>
        </div>
        <span className="build-badge">🤖 AI Agent · Hermes Profile</span>
      </div>

      {/* Core Rules */}
      <Section title="Core Rules" icon="📜" color="#ef4444" defaultOpen={true}>
        <div className="rules-grid">
          {coreRules.map((r, i) => (
            <div key={i} className="rule-card">
              <span className="rule-icon">{r.icon}</span>
              <span className="rule-text">{r.rule}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Process Flow */}
      <Section title="Trade Process" icon="🔄" color="#6366f1" defaultOpen={true}>
        <div className="arch-flow">
          {processes.map((layer, li) => (
            <div key={li} className="arch-layer">
              <div className="layer-label-wrapper">
                <span className="layer-line"></span>
                <span className="layer-label" style={{ background: layer.color + '15', color: layer.color }}>
                  {layer.icon} {layer.name}
                </span>
                <span className="layer-line"></span>
              </div>
              <div className="layer-cards">
                {layer.items.map((item, ii) => (
                  <div key={ii} className="arch-card" style={{
                    background: layer.color + '08',
                    borderColor: layer.color + '25',
                  }}>
                    <span className="arch-icon">{item.icon}</span>
                    <span className="arch-name">{item.label}</span>
                    <span className="arch-detail">{item.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Schedule */}
      <Section title="Schedule" icon="⏰" color="#22c55e" defaultOpen={true}>
        <div className="schedule-grid">
          {schedules.map((s, i) => (
            <div key={i} className={`schedule-card ${s.type}`}>
              <div className="sched-hd">
                <span className="sched-time">{s.time}</span>
                <span className={`sched-type ${s.type}`}>{s.type === 'auto' ? '🔄 Auto' : '👤 Manual'}</span>
              </div>
              <div className="sched-playbook">{s.playbook}</div>
              <div className="sched-what">{s.what}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Risk Management */}
      <Section title="Risk Management" icon="🛡️" color="#f59e0b" defaultOpen={true}>
        <div className="risk-grid">
          {riskRules.map((r, i) => (
            <div key={i} className="risk-card">
              <span className="risk-rule">{r.rule}</span>
              <span className="risk-value">{r.value}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* DB Tables */}
      <Section title="Database Tables" icon="🗄️" color="#38bdf8" defaultOpen={false}>
        <div className="db-grid">
          {dbTables.map(t => (
            <div key={t.name} className="db-card">
              <div className="db-hd">
                <span className="db-name">{t.name}</span>
                <span className={`db-type ${t.type}`}>{t.type === 'vector' ? '📐 vector' : '📋 relational'}</span>
              </div>
              <div className="db-desc">{t.desc}</div>
            </div>
          ))}
        </div>
        <div className="db-schema-block">
          <pre className="schema-sql">{`trades (id, ticker, direction, entry_price, qty, stop_loss, target,
       status, pnl, pnl_pct, entry_at, exit_at, trader VARCHAR(20) DEFAULT 'anya')

account (id, cash, equity, updated_at)

account_snapshots (id, total_value, cash, positions, daily_pnl, taken_at)

anya_logs (id, playbook, run_at, status, summary, output_path)

deep_dive_requests (id, ticker, reason, requested_by, status, created_at)

deep_dive_results (id, ticker, verdict, fair_value, conviction, catalysts)

pipeline_reports (id, pipeline, date, content, ticker, embedding VECTOR(384))

weekly_screen (id, ticker, category, deep_dive_status, reasoning)`}</pre>
        </div>
      </Section>

      {/* Scripts */}
      <Section title="Scripts Reference" icon="📜" color="#ec4899" defaultOpen={false}>
        <div className="scripts-table">
          <div className="scripts-hd">
            <span className="sc-col-name">Script</span>
            <span className="sc-col-when">Trigger</span>
            <span className="sc-col-what">Purpose</span>
          </div>
          {scripts.map((s, i) => (
            <div key={i} className="script-row">
              <span className="sc-name">{s.name}</span>
              <span className="sc-when">{s.when}</span>
              <span className="sc-what">{s.what}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Trade Flow */}
      <Section title="Trade Flow (On-Demand)" icon="🌊" color="#06b6d4" defaultOpen={false}>
        <pre className="schema-sql">{`═══ BUY FLOW ═══

BUY signal found
  │
  ├─ 🔍 pre-trade-check.py TICKER LONG PRICE
  │    12 items → ALL MUST PASS
  │    └─ FAIL → reject, report why
  │
  ├─ 📐 position-size.py TICKER PRICE --source X
  │    Kelly formula → shares, SL, TP, risk
  │
  ├─ 📋 PHASE 1: Full Analysis (6 sections)
  │    Deep Dive + Financial Health + Catalysts
  │    + Price Context + Risk + Portfolio Fit
  │
  ├─ 📋 PHASE 2: PROPOSE TO OSCAR
  │    Format: trade-proposal-format.md
  │    Wait for: buy / size X / cancel
  │
  └─ ✅ EXECUTE (only after Oscar confirms)
       trades_db.py trader=anya open TICKER LONG QTY @PRICE SL X TP X

═══ CLOSE FLOW ═══

SL hit / TP hit / thesis broken
  │
  ├─ 📋 PROPOSE CLOSE TO OSCAR
  │    Format: trade-proposal-format.md (CLOSE section)
  │    Wait for: yes / let it run / adjust SL
  │
  └─ ✅ EXECUTE (only after Oscar confirms)
       trades_db.py trader=anya close TRADE_ID @PRICE
       → journal.py TRADE_ID "reflection"`}</pre>
      </Section>

      {/* Data Flow */}
      <Section title="Data Flow Architecture" icon="🌐" color="#84cc16" defaultOpen={false}>
        <pre className="schema-sql">{`Anya (Docker)                        Maya (Docker)                      Vercel
    │                                      │                                 │
    ├─ daily-check.py ──────────────────►  │                                 │
    │   (morning / premarket / mid-week    │                                 │
    │    / weekly / monthly)               │                                 │
    │                                      │                                 │
    ├─ request-deep-dive.py ──────────► INSERT deep_dive_requests            │
    │                                          │                             │
    │                                      ◄── Poll: deep_dive_results        │
    │                                      │    (BUY/WATCH/PASS)             │
    │  pre-trade-check.py ◄───────────────┤    + pipeline_reports             │
    │  position-size.py                   │                                 │
    │  propose Oscar ──► confirm ──► INSERT trades                           │
    │                                      │                                 │
    └─ update-dashboard.py --sync-only ───┤──── git push ──────────────► Auto-deploy
                                         (DB → JSON)                       oscary.space
        `}</pre>
      </Section>

      <div className="footer">
        <span>🔹 Equity Lab — Long Trade System · Anya (Professional Trader)</span>
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
        .section:nth-of-type(1) .section-icon-wrap { background: rgba(239,68,68,0.15); }
        .section:nth-of-type(2) .section-icon-wrap { background: rgba(99,102,241,0.15); }
        .section:nth-of-type(3) .section-icon-wrap { background: rgba(34,197,94,0.15); }
        .section:nth-of-type(4) .section-icon-wrap { background: rgba(245,158,11,0.15); }
        .section:nth-of-type(5) .section-icon-wrap { background: rgba(56,189,248,0.15); }
        .section:nth-of-type(6) .section-icon-wrap { background: rgba(236,72,153,0.15); }
        .section:nth-of-type(7) .section-icon-wrap { background: rgba(6,182,212,0.15); }
        .section:nth-of-type(8) .section-icon-wrap { background: rgba(132,204,22,0.15); }
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
        .layer-cards { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
        .arch-card { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 14px 16px; border-radius: 10px; border: 1px solid; min-width: 150px; max-width: 180px; text-align: center; }
        .arch-icon { font-size: 22px; }
        .arch-name { font-size: 13px; font-weight: 600; color: #f0f6fc; }
        .arch-detail { font-size: 11px; color: #6b7280; line-height: 1.4; }

        /* Core Rules */
        .rules-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 8px 0; }
        @media (max-width: 640px) { .rules-grid { grid-template-columns: 1fr; } }
        .rule-card { display: flex; align-items: center; gap: 10px; padding: 12px 14px; background: #0f172a; border: 1px solid #1e293b; border-radius: 8px; }
        .rule-icon { font-size: 18px; flex-shrink: 0; }
        .rule-text { font-size: 13px; color: #d1d5db; font-weight: 500; line-height: 1.4; }

        /* Schedule */
        .schedule-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 8px 0; }
        @media (max-width: 768px) { .schedule-grid { grid-template-columns: 1fr; } }
        .schedule-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 10px; padding: 14px; }
        .schedule-card.auto { border-left: 3px solid #22c55e; }
        .schedule-card.manual { border-left: 3px solid #f59e0b; }
        .sched-hd { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
        .sched-time { font-size: 15px; font-weight: 700; color: #f0f6fc; font-family: 'SF Mono', 'Fira Code', monospace; }
        .sched-type { font-size: 10px; padding: 2px 8px; border-radius: 4px; font-weight: 500; }
        .sched-type.auto { background: rgba(34,197,94,0.1); color: #4ade80; }
        .sched-type.manual { background: rgba(245,158,11,0.1); color: #fbbf24; }
        .sched-playbook { font-size: 11px; color: #6b7280; font-family: 'SF Mono', 'Fira Code', monospace; margin-bottom: 4px; }
        .sched-what { font-size: 13px; color: #9ca3af; line-height: 1.5; }

        /* Risk Management */
        .risk-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 8px 0; }
        @media (max-width: 640px) { .risk-grid { grid-template-columns: 1fr; } }
        .risk-card { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #0f172a; border: 1px solid #1e293b; border-radius: 8px; }
        .risk-rule { font-size: 13px; font-weight: 600; color: #f0f6fc; }
        .risk-value { font-size: 12px; color: #fbbf24; font-family: 'SF Mono', 'Fira Code', monospace; text-align: right; }

        /* Database Cards */
        .db-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 8px 0; }
        @media (max-width: 640px) { .db-grid { grid-template-columns: 1fr; } }
        .db-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 10px; padding: 14px; }
        .db-hd { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
        .db-name { font-size: 14px; font-weight: 700; color: #f0f6fc; font-family: 'SF Mono', 'Fira Code', monospace; }
        .db-type { font-size: 10px; padding: 2px 8px; border-radius: 4px; }
        .db-type.vector { background: rgba(56,189,248,0.1); color: #38bdf8; }
        .db-type.relational { background: rgba(168,85,247,0.1); color: #a855f7; }
        .db-desc { font-size: 12px; color: #6b7280; margin-top: 4px; }
        .db-schema-block { margin-top: 16px; }
        .schema-sql { background: #0f172a; border: 1px solid #1e293b; border-radius: 8px; padding: 16px; font-size: 12px; line-height: 1.7; color: #94a3b8; overflow-x: auto; white-space: pre; font-family: 'SF Mono', 'Fira Code', monospace; }

        /* Scripts Table */
        .scripts-table { display: flex; flex-direction: column; gap: 0; padding: 8px 0; }
        .scripts-hd, .script-row { display: grid; grid-template-columns: 2fr 1.5fr 2.5fr; gap: 12px; padding: 10px 14px; align-items: start; }
        .scripts-hd { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; border-bottom: 1px solid #1c2128; }
        .script-row { border-bottom: 1px solid #1c2128; }
        .script-row:last-child { border-bottom: none; }
        .script-row:hover { background: #0f172a; border-radius: 6px; }
        .sc-name { font-size: 12px; font-weight: 600; color: #f0f6fc; font-family: 'SF Mono', 'Fira Code', monospace; }
        .sc-when { font-size: 11px; color: #6b7280; }
        .sc-what { font-size: 12px; color: #9ca3af; }

        .footer { text-align: center; padding: 24px 0; }
        .footer span { font-size: 12px; color: #4b5563; }
        .footer .deploy-badge { margin-left: 12px; padding: 2px 10px; border-radius: 6px; background: #1c2128; }
      `}</style>
    </div>
  )
}
