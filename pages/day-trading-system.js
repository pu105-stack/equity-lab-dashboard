import { useState, useEffect } from 'react'

const processes = [
  {
    name: 'Pre-Market',
    icon: '🌅',
    items: [
      { icon: '📖', label: 'Read Morning Scan', detail: 'Extract market bias, key levels, sector flow from Maya' },
      { icon: '📋', label: 'Build Watchlist', detail: '7 sources merged → dedupe → filter → top 5-15 tickers' },
      { icon: '⛔', label: 'Exclude Anya Holdings', detail: 'Never day-trade what Anya holds (ticker collision)' },
      { icon: '📅', label: 'Earnings Check', detail: 'Drop any ticker with earnings today' },
      { icon: '🌪️', label: 'VIX Check', detail: '> 30 → 50% size cap, > 35 → full stop' },
    ],
    color: '#f97316',
  },
  {
    name: 'Market Open',
    icon: '🎯',
    items: [
      { icon: '👁️', label: 'Observe Only (15min)', detail: '21:30-21:45 HKT — watch opening, no entries' },
      { icon: '🔍', label: '4 Scan Sessions', detail: '22:00 / 22:30 / 23:00 / 23:30 — 5 strategies checked' },
      { icon: '📊', label: 'Chart + Propose', detail: 'mplfinance chart → signal → propose to Oscar' },
      { icon: '✅', label: '7 Hard Gates', detail: 'Avg vol > 1M, spread ≤ 0.05%, ATR ≤ 5%, no earnings, not Anya, daily loss < 2%, trades < 8' },
      { icon: '📈', label: '3 Core Strategies', detail: 'VWAP MR, Opening Range Breakout, Volume Surge' },
    ],
    color: '#22c55e',
  },
  {
    name: 'Execution & Monitor',
    icon: '⚡',
    items: [
      { icon: '🗣️', label: 'Propose to Oscar', detail: 'Chart + entry/SL/TP + size + risk → Oscar confirms' },
      { icon: '👁️', label: '15-min Scan Loop', detail: 'viper-scan-15min — watchlist loop, signal detection' },
      { icon: '⏱️', label: '4-Tier Exit Monitor', detail: 'Hard SL → TP1(50%) → TP2(30%) → Trail(20%) / Time stop' },
      { icon: '🔴', label: 'Time Stop', detail: 'VWAP 90min / ORB 2h / Vol Surge 1h max hold' },
      { icon: '🌙', label: 'EOD Force-Close', detail: '03:55 HKT — blind close ALL, no overnight hold ever' },
    ],
    color: '#ef4444',
  },
]

const schedules = [
  { time: '21:00 HKT', playbook: 'premarket', what: '🌅 Premarket Brief: Build watchlist from 7 sources, VIX check, Anya exclude, earnings drop → top 5-15', type: 'auto' },
  { time: '21:05 HKT', playbook: 'backfill', what: '📦 Intraday Backfill: Alpaca 5d 5-min bars for 20 startup tickers', type: 'auto' },
  { time: '21:30-21:45 HKT', playbook: 'observe', what: '👁️ Observe Only: Watch opening tick, no entries, wait for 15min candle', type: 'manual' },
  { time: '21:32-03:58 HKT', playbook: 'collect', what: '📡 Intraday Collect: 2-min live heartbeat snapshot for watchlist', type: 'auto' },
  { time: '21:35-03:55 HKT', playbook: 'scan-15min', what: '🔍 Scan 15min: Watchlist loop + 5 strategy signals → propose to Oscar', type: 'auto' },
  { time: '22:00/22:30/23:00/23:30 HKT', playbook: 'scan-sessions', what: '🎯 4 Scan Sessions: ORB → Volume + EMA → All strategies → VWAP MR only', type: 'manual' },
  { time: '03:55 HKT', playbook: 'eod-close', what: '🌙 EOD Force-Close: Blind close ALL positions, no overnight hold. Safety net.', type: 'auto' },
  { time: '10:00 HKT (Tue-Sat)', playbook: 'postmarket', what: '📊 Daily P&L: Closed trades, rolling P&L, win rate, equity vs seed $100K', type: 'auto' },
  { time: 'Sat 22:00 HKT', playbook: 'weekly-review', what: '📈 Weekly Review: Strategy attribution, parameter tuning, watchlist refresh', type: 'auto' },
  { time: '1 Mar / 1 Nov 21:00', playbook: 'dst-switch', what: '🕐 DST Reminder: HKT schedule locked, reminder-only — no auto flip', type: 'auto' },
  { time: 'Ad-hoc', playbook: 'place-trade', what: '💹 Place Trade: Oscar confirms → place_trade.py → DB audit', type: 'manual' },
  { time: 'Ad-hoc', playbook: 'journal', what: '📝 Trade Journal: auto-generated entry with lesson per trade', type: 'manual' },
]

const riskRules = [
  { rule: 'Risk Per Trade', value: '0.3-0.5% of equity ($300-$500 on $100K)' },
  { rule: 'Max Position Size', value: '20% of equity ($20K)' },
  { rule: 'Max Daily Loss', value: '2% ($2,000) — full session stop' },
  { rule: 'Max Weekly Drawdown', value: '-5% from Mon start → next day 50% size' },
  { rule: 'Max Consecutive Losses', value: '3 in a row → stop session, review' },
  { rule: 'Max Daily Trades', value: '8 (then stop, no more)' },
  { rule: 'Min R/R Ratio', value: '1:1.5' },
  { rule: 'Overnight Hold', value: 'NEVER — force-close 15:55 ET (03:55 HKT)' },
  { rule: 'SL Distance', value: 'max(1×ATR, swing level), ≤ 2% of entry' },
  { rule: 'VIX Cap', value: '> 30 = 50% size · > 35 = full stop' },
]

const strategies = [
  {
    name: 'VWAP Mean Reversion',
    icon: '📉',
    color: '#3b82f6',
    signal: 'price < VWAP - 0.3% AND RSI(14) < 32',
    confirm: '5min candle close (not wick), vol > 1.2x 20-bar avg',
    entry: 'Next 5min candle open',
    sl: 'max(swing_low[-10], entry - 1.5×ATR)',
    tp1: 'VWAP (mean target)',
    tp2: 'entry + 1.5×SL_distance',
    trail: 'At VWAP → trail SL = min(1×ATR, prior candle low)',
    timeStop: '90min if TP1 not hit',
    avoid: 'RSI < 30 for 5+ bars (momentum dead), VIX > 30',
    winTarget: '~55-60%, R/R 1:1.5',
  },
  {
    name: 'Opening Range Breakout',
    icon: '📈',
    color: '#a855f7',
    signal: '5min close > ORB_high AND vol > 2× 20-bar avg',
    confirm: 'No wick rejection above (close in top 30% of bar)',
    entry: 'Next 5min candle',
    sl: 'ORB_low - 0.05% (failed breakout)',
    tp1: 'ORB_high + 1×ORB_range',
    tp2: 'ORB_high + 2×ORB_range',
    trail: 'After TP1 → trail 1×ATR behind',
    timeStop: '2h if neither TP hit',
    avoid: 'ORB range > 3% of price (too volatile)',
    winTarget: '~45-50%, R/R 1:2',
  },
  {
    name: 'Volume Surge',
    icon: '🔥',
    color: '#ef4444',
    signal: 'bar vol > 2× 20-bar avg AND bar move > 0.5%',
    confirm: 'LONG if close > open, SHORT if close < open',
    entry: 'Next bar',
    sl: 'bar low (LONG) / bar high (SHORT) - 0.05%',
    tp1: 'bar mid + 1×bar_range',
    tp2: 'bar high + 1×bar_range (LONG) / low - 1×bar_range (SHORT)',
    trail: 'After TP1 → trail',
    timeStop: '1h',
    avoid: 'Surge into obvious S/R (likely rejection), no follow-through in 2 bars',
    winTarget: '~50-55%, R/R 1:1.5',
  },
]

const cronJobs = [
  { id: '4e1dddb52a4b', name: 'viper-premarket', sched: '0 21 * * 1-5', hkt: '21:00 Mon-Fri', script: 'premarket.py', status: '✅ LIVE' },
  { id: '618d8ebd9fa8', name: 'viper-intraday-backfill', sched: '5 21 * * 1-5', hkt: '21:05 Mon-Fri', script: 'intraday_backfill.py', status: '✅ LIVE' },
  { id: '2843f12ad6c6', name: 'viper-intraday-collect', sched: '*/2 21-3 * * 1-5', hkt: '21:32-03:58 */2 min', script: 'intraday_collect.py', status: '✅ LIVE' },
  { id: '67ab5afe3c12', name: 'viper-scan-15min', sched: '*/15 21-3 * * 1-5', hkt: '21:35-03:55 */15 min', script: 'viper-scan-15min.py', status: '✅ LIVE' },
  { id: '8e595e065a26', name: 'viper-eod-close', sched: '55 3 * * 2-6', hkt: '03:55 Tue-Sat', script: 'eod_close.py', status: '✅ LIVE' },
  { id: 'd4cbc5fd0e01', name: 'viper-postmarket', sched: '0 10 * * 2-6', hkt: '10:00 Tue-Sat', script: 'postmarket.py', status: '✅ LIVE' },
  { id: '395755434f84', name: 'viper-monitor-poll', sched: '* 21-3 * * 1-5', hkt: '21:00-03:55 */1 min', script: 'monitor_poll.py', status: '⏸️ PAUSED' },
  { id: '8dcbf65da30f', name: 'viper-weekly-review', sched: '0 22 * * 6', hkt: 'Sat 22:00', script: 'viper_weekly_review.py', status: '✅ LIVE' },
  { id: 'f7934e63bbc8', name: 'viper-dst-switch', sched: '0 21 1 3,11 *', hkt: '1 Mar/Nov 21:00', script: 'dst_switch.py', status: '✅ LIVE' },
]

const dbTables = [
  { name: 'trades', desc: 'All trade records (trader=day-trader)', type: 'relational' },
  { name: 'account', desc: 'Cash + equity balance (day-trader row)', type: 'relational' },
  { name: 'account_snapshots', desc: 'Daily EOD snapshots (day-trader)', type: 'relational' },
  { name: 'intraday_prices', desc: '5-min history + 1-min live heartbeat (timeframe key)', type: 'relational' },
  { name: 'watchlist', desc: 'Today\'s watchlist from premarket (5-15 tickers)', type: 'relational' },
  { name: 'watchlist_history', desc: 'Daily watchlist archive (idempotent)', type: 'relational' },
  { name: 'decisions', desc: 'Scan signals + premarket decisions log', type: 'relational' },
  { name: 'position_checkpoints', desc: '4-tier exit monitor audit trail', type: 'relational' },
]

const scripts = [
  { name: 'premarket.py', when: 'Cron 21:00 Mon-Fri', what: '7-source watchlist builder: Maya + FMP + news → dedupe → filter → top 5-15' },
  { name: 'intraday_backfill.py', when: 'Cron 21:05 Mon-Fri', what: 'Alpaca 5d 5-min OHLCV backfill for 20 startup tickers' },
  { name: 'intraday_collect.py', when: 'Cron */2 21-32-03:58', what: '2-min live heartbeat snapshot for watchlist (silent on success)' },
  { name: 'viper-scan-15min.py', when: 'Cron */15 21-35-03:55', what: 'Watchlist loop + 5 strategy plugins → signals → propose to Oscar' },
  { name: 'eod_close.py', when: 'Cron 03:55 Tue-Sat', what: 'EOD force-close ALL positions, cancel orders, DB audit (silent)' },
  { name: 'postmarket.py', when: 'Cron 10:00 Tue-Sat', what: 'Daily P&L report (always send — even 0 trades)' },
  { name: 'monitor_poll.py', when: 'Cron * 21-3 ⏸️ PAUSED', what: '1-min 4-tier exit monitor (hard_sl/tp1/tp2/trail/time_stop)' },
  { name: 'viper_weekly_review.py', when: 'Cron Sat 22:00', what: 'Strategy attribution, parameter tuning, watchlist refresh' },
  { name: 'place_trade.py', when: 'Manual (Oscar confirmed)', what: 'Market/limit order execution, partial close hooks (Alpaca paper)' },
  { name: 'risk.py', when: 'Library (scanner/place_trade)', what: '7 hard pre-trade gates, position sizer, VIX adjustment' },
  { name: 'scanner.py', when: 'Library (scan-15min)', what: 'Multi-strategy orchestrator + trade level computation' },
  { name: 'indicators.py', when: 'Library', what: 'VWAP/RSI/EMA/MACD/BB/ATR — pandas-ta wrappers' },
]

const coreRules = [
  { icon: '🎯', rule: 'Surgical day trader. 3 strategies > 10. Only A+ setups.' },
  { icon: '🧘', rule: 'Patience = edge. Pass on B/C. Cash is a position.' },
  { icon: '✂️', rule: 'Cut fast, trail slow. First loss is best loss.' },
  { icon: '🌙', rule: 'NEVER hold overnight. Force-close by 15:55 ET.' },
  { icon: '📖', rule: 'Every trade = 1 sentence in journal. Learn from wins AND losses.' },
  { icon: '⛔', rule: 'Never day-trade a ticker Anya is holding (ticker collision rule).' },
  { icon: '📋', rule: 'One hard fail = PASS. No exceptions. Day trading is patience.' },
  { icon: '🛑', rule: '3 consecutive losses = full stop + reduce size next day.' },
]

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

function StrategyCard({ s }) {
  return (
    <div className="strat-card" style={{ borderColor: s.color + '40' }}>
      <div className="strat-hd">
        <span className="strat-icon">{s.icon}</span>
        <span className="strat-name" style={{ color: s.color }}>{s.name}</span>
      </div>
      <div className="strat-body">
        <div className="strat-row"><span className="strat-label">Signal</span><span className="strat-val">{s.signal}</span></div>
        <div className="strat-row"><span className="strat-label">Confirm</span><span className="strat-val">{s.confirm}</span></div>
        <div className="strat-row"><span className="strat-label">Entry</span><span className="strat-val">{s.entry}</span></div>
        <div className="strat-row"><span className="strat-label">SL</span><span className="strat-val">{s.sl}</span></div>
        <div className="strat-row"><span className="strat-label">TP1/TP2</span><span className="strat-val">{s.tp1} / {s.tp2}</span></div>
        <div className="strat-row"><span className="strat-label">Trail</span><span className="strat-val">{s.trail}</span></div>
        <div className="strat-row"><span className="strat-label">⏱️ Time Stop</span><span className="strat-val">{s.timeStop}</span></div>
        <div className="strat-row"><span className="strat-label">Avoid</span><span className="strat-val">{s.avoid}</span></div>
        <div className="strat-row"><span className="strat-label">🎯 Target</span><span className="strat-val">{s.winTarget}</span></div>
      </div>
    </div>
  )
}

export default function DayTradingSystem() {
  return (
    <div className="container">

      {/* Header */}
      <div className="header">
        <div>
          <h1>🐍 Day Trading System</h1>
          <p className="header-sub">VIPER — Technical Day Trader · US Equities · Minutes〜Hours</p>
        </div>
        <span className="build-badge">🤖 AI Agent · Hermes Profile (day-trader)</span>
      </div>

      {/* SOUL */}
      <Section title="Trader Soul" icon="🧘" color="#84cc16" defaultOpen={true}>
        <div className="soul-block">
          <p>Patience &gt; activity. 1 great trade &gt; 5 mediocre ones.</p>
          <p>Wait for A+. Pass on B/C. Always.</p>
          <p>Cut the first loss. Don't average. Don't hope.</p>
          <p>Trail the winner, don't fix the loser.</p>
          <p>Every trade is a lesson. Every day, write 1 sentence.</p>
          <p>When in doubt, sit out. <strong>Cash is a position.</strong></p>
          <p>The plan is sacred. The chart is the truth. The indicator is just a hint.</p>
        </div>
      </Section>

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

      {/* Strategies */}
      <Section title="Strategy Library" icon="📚" color="#8b5cf6" defaultOpen={true}>
        <div className="strategies-grid">
          {strategies.map((s, i) => (
            <StrategyCard key={i} s={s} />
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

      {/* Pre-Trade Checklist */}
      <Section title="Pre-Trade Checklist — 7 Gates" icon="🚧" color="#ec4899" defaultOpen={false}>
        <div className="gates-grid">
          <div className="gate-col">
            <div className="gate-cat-hd">🔴 HARD (auto-reject)</div>
            <div className="gate-item"><span className="gate-num">1</span> Avg daily vol &gt; 1M (5d)</div>
            <div className="gate-item"><span className="gate-num">2</span> Spread ≤ 0.05%</div>
            <div className="gate-item"><span className="gate-num">3</span> ATR(14) ≤ 5% of price</div>
            <div className="gate-item"><span className="gate-num">4</span> No earnings today</div>
            <div className="gate-item"><span className="gate-num">5</span> Not Anya's position</div>
            <div className="gate-item"><span className="gate-num">6</span> Daily loss &lt; 2%</div>
            <div className="gate-item"><span className="gate-num">7</span> Trades today &lt; 8</div>
          </div>
          <div className="gate-col">
            <div className="gate-cat-hd">🟡 SOFT (Oscar can override)</div>
            <div className="gate-item"><span className="gate-num">8</span> R/R ≥ 1:1.5</div>
            <div className="gate-item"><span className="gate-num">9</span> SPY direction aligned</div>
            <div className="gate-item"><span className="gate-num">10</span> &gt;30min from major event</div>
            <div className="gate-rule">One hard fail = <strong>PASS</strong>. No exceptions.</div>
          </div>
        </div>
      </Section>

      {/* Cron Jobs */}
      <Section title="Cron Jobs — 9 Active (1 Paused)" icon="⏲️" color="#06b6d4" defaultOpen={false}>
        <div className="cron-table">
          <div className="cron-hd">
            <span className="cr-col-id">Job ID</span>
            <span className="cr-col-name">Name</span>
            <span className="cr-col-hkt">HKT Schedule</span>
            <span className="cr-col-script">Script</span>
            <span className="cr-col-status">Status</span>
          </div>
          {cronJobs.map((j, i) => (
            <div key={i} className="cron-row">
              <span className="cr-id">{j.id}</span>
              <span className="cr-name">{j.name}</span>
              <span className="cr-hkt">{j.hkt}</span>
              <span className="cr-script">{j.script}</span>
              <span className={`cr-status ${j.status.includes('LIVE') ? 'live' : 'paused'}`}>{j.status}</span>
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
          <pre className="schema-sql">{`trades (id, ticker, direction ENUM(LONG/SHORT), strategy ENUM(position/swing/day/scalp),
       entry_price, qty, stop_loss, target, status, pnl, trader VARCHAR DEFAULT 'day-trader')

account (id, cash, equity, trader VARCHAR DEFAULT 'day-trader')

account_snapshots (id, trader, snapshot_date, equity, cash, unrealized_pnl, daily_pnl)

intraday_prices (ticker, bar_timestamp, timeframe VARCHAR(10), open, high, low, close, volume,
                 UNIQUE(ticker, bar_timestamp, timeframe))

watchlist (id, trader, ticker, source, composite_score, gap_pct, premarket_price,
           vol_avg_5d, status, created_at)

watchlist_history (id, run_date, ticker, source, score, UNIQUE(ticker, run_date))

decisions (id, decision_type, subject, rationale JSONB, source_inputs JSONB, decided_by, created_at)

position_checkpoints (id, trade_id, ticker, status, r_multiple, reason, created_at)`}</pre>
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

      {/* Data Flow */}
      <Section title="System Architecture" icon="🌐" color="#84cc16" defaultOpen={false}>
        <pre className="schema-sql">{`                     ┌──────────────────┐
                     │      Oscar       │
                     │  (final call)    │
                     └────────┬─────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
   ┌─────────┐           ┌─────────┐          ┌─────────┐
   │  Maya   │           │  Viper  │          │  Anya   │
   │ default │  ─reads─▶ │ day-trdr│ ◀─avoid─ │ trader  │
   │ profile │           │ profile │          │ profile │
   └────┬────┘           └────┬────┘          └────┬────┘
        │                     │                    │
   pipeline_reports      trades + journal     trades (swing)
   deep_dive_results     intraday_prices      account
   weekly_screen         account_snapshots
   news_summary          watchlist + decisions
                         position_checkpoints

══════ VIper 讀（read-only）══════
pipeline_reports (morning-scan, evening-review, deep-dive)
weekly_screen | deep_dive_results | news_summary
earnings_calendar | daily_prices
trades WHERE trader!='day-trader' (collision check)

══════ VIper 寫 ══════
trades (trader='day-trader') | intraday_prices | account_snapshots
account | watchlist | watchlist_history | decisions
position_checkpoints`}</pre>
      </Section>

      {/* SL/TP Rules */}
      <Section title="SL / TP / Trailing Rules" icon="🎯" color="#f97316" defaultOpen={false}>
        <div className="rules-detail">
          <div className="rule-detail-card">
            <div className="rd-hd">📏 SL Distance</div>
            <div className="rd-body">max(1.0×ATR, key_swing_level) but ≤ 2% of entry</div>
          </div>
          <div className="rule-detail-card">
            <div className="rd-hd">🎯 TP1 (50% of position)</div>
            <div className="rd-body">entry + 1.5×SL_distance</div>
          </div>
          <div className="rule-detail-card">
            <div className="rd-hd">🎯 TP2 (remaining 50%)</div>
            <div className="rd-body">entry + 3.0×SL_distance</div>
          </div>
          <div className="rule-detail-card">
            <div className="rd-hd">🔄 Trailing</div>
            <div className="rd-body">Price hits +1R → move SL to breakeven<br/>TP1 hit → trail remaining with 1×ATR behind</div>
          </div>
          <div className="rule-detail-card">
            <div className="rd-hd">⏱️ Time Stops</div>
            <div className="rd-body">ORB: 2h · VWAP MR: 90min · Volume Surge: 1h</div>
          </div>
          <div className="rule-detail-card">
            <div className="rd-hd">🌙 EOD Stop</div>
            <div className="rd-body">Force-close ALL by 15:55 ET (03:55 HKT). Non-negotiable.</div>
          </div>
        </div>
      </Section>

      <div className="footer">
        <span>🔹 Equity Lab — Day Trading System · VIPER (Technical Day Trader)</span>
        <span className="deploy-badge">⚡ v2.2 · 2026-06</span>
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
        .section:nth-of-type(1) .section-icon-wrap { background: rgba(132,204,22,0.15); }
        .section:nth-of-type(2) .section-icon-wrap { background: rgba(239,68,68,0.15); }
        .section:nth-of-type(3) .section-icon-wrap { background: rgba(99,102,241,0.15); }
        .section:nth-of-type(4) .section-icon-wrap { background: rgba(34,197,94,0.15); }
        .section:nth-of-type(5) .section-icon-wrap { background: rgba(139,92,246,0.15); }
        .section:nth-of-type(6) .section-icon-wrap { background: rgba(245,158,11,0.15); }
        .section:nth-of-type(7) .section-icon-wrap { background: rgba(236,72,153,0.15); }
        .section:nth-of-type(8) .section-icon-wrap { background: rgba(6,182,212,0.15); }
        .section:nth-of-type(9) .section-icon-wrap { background: rgba(56,189,248,0.15); }
        .section:nth-of-type(10) .section-icon-wrap { background: rgba(236,72,153,0.15); }
        .section:nth-of-type(11) .section-icon-wrap { background: rgba(132,204,22,0.15); }
        .section:nth-of-type(12) .section-icon-wrap { background: rgba(249,115,22,0.15); }
        .section-title { font-size: 14px; font-weight: 600; color: #f0f6fc; }
        .section-arrow { transition: transform 0.2s; display: flex; color: var(--accent); opacity: 0.5; }
        .section-arrow.open { transform: rotate(180deg); }
        .section-body { padding: 0 20px 20px; }

        /* Soul */
        .soul-block { padding: 16px; background: #0f172a; border: 1px solid #1e293b; border-radius: 10px; margin: 8px 0; }
        .soul-block p { font-size: 13px; color: #d1d5db; line-height: 1.8; margin: 0; font-style: italic; }
        .soul-block p strong { color: #4ade80; }

        /* Core Rules */
        .rules-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 8px 0; }
        @media (max-width: 640px) { .rules-grid { grid-template-columns: 1fr; } }
        .rule-card { display: flex; align-items: center; gap: 10px; padding: 12px 14px; background: #0f172a; border: 1px solid #1e293b; border-radius: 8px; }
        .rule-icon { font-size: 18px; flex-shrink: 0; }
        .rule-text { font-size: 13px; color: #d1d5db; font-weight: 500; line-height: 1.4; }

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

        /* Strategies */
        .strategies-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; padding: 12px 0; }
        @media (max-width: 960px) { .strategies-grid { grid-template-columns: 1fr; } }
        .strat-card { background: #0f172a; border: 1px solid; border-radius: 10px; overflow: hidden; }
        .strat-hd { display: flex; align-items: center; gap: 8px; padding: 12px 14px; border-bottom: 1px solid #1e293b; }
        .strat-icon { font-size: 20px; }
        .strat-name { font-size: 14px; font-weight: 700; }
        .strat-body { padding: 12px 14px; display: flex; flex-direction: column; gap: 6px; }
        .strat-row { display: flex; gap: 8px; font-size: 11px; line-height: 1.5; }
        .strat-label { color: #6b7280; font-weight: 600; min-width: 55px; flex-shrink: 0; }
        .strat-val { color: #d1d5db; }

        /* Pre-Trade Gates */
        .gates-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 12px 0; }
        @media (max-width: 640px) { .gates-grid { grid-template-columns: 1fr; } }
        .gate-col { display: flex; flex-direction: column; gap: 8px; }
        .gate-cat-hd { font-size: 13px; font-weight: 700; padding: 8px 0; }
        .gate-item { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #0f172a; border: 1px solid #1e293b; border-radius: 6px; font-size: 13px; color: #d1d5db; }
        .gate-num { font-size: 11px; font-weight: 700; color: #6b7280; min-width: 18px; }
        .gate-rule { margin-top: 12px; padding: 10px 14px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); border-radius: 8px; font-size: 13px; color: #fca5a5; text-align: center; }

        /* Cron Table */
        .cron-table { display: flex; flex-direction: column; gap: 0; padding: 8px 0; }
        .cron-hd, .cron-row { display: grid; grid-template-columns: 2fr 1.8fr 2fr 1.8fr 1.2fr; gap: 8px; padding: 8px 14px; align-items: center; }
        .cron-hd { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; border-bottom: 1px solid #1c2128; }
        .cron-row { border-bottom: 1px solid #1c2128; font-size: 11px; }
        .cron-row:last-child { border-bottom: none; }
        .cron-row:hover { background: #0f172a; border-radius: 6px; }
        .cr-id { font-family: 'SF Mono', 'Fira Code', monospace; color: #6b7280; font-size: 10px; }
        .cr-name { font-weight: 600; color: #f0f6fc; }
        .cr-hkt { color: #9ca3af; font-family: 'SF Mono', 'Fira Code', monospace; }
        .cr-script { color: #94a3b8; font-family: 'SF Mono', 'Fira Code', monospace; }
        .cr-status { font-weight: 600; }
        .cr-status.live { color: #4ade80; }
        .cr-status.paused { color: #fbbf24; }

        /* Database Cards */
        .db-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 8px 0; }
        @media (max-width: 640px) { .db-grid { grid-template-columns: 1fr; } }
        .db-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 10px; padding: 14px; }
        .db-hd { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
        .db-name { font-size: 14px; font-weight: 700; color: #f0f6fc; font-family: 'SF Mono', 'Fira Code', monospace; }
        .db-type { font-size: 10px; padding: 2px 8px; border-radius: 4px; }
        .db-type.relational { background: rgba(168,85,247,0.1); color: #a855f7; }
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

        /* Detail rules */
        .rules-detail { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 8px 0; }
        @media (max-width: 640px) { .rules-detail { grid-template-columns: 1fr; } }
        .rule-detail-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 8px; padding: 14px; }
        .rd-hd { font-size: 13px; font-weight: 700; color: #f0f6fc; margin-bottom: 6px; }
        .rd-body { font-size: 13px; color: #9ca3af; line-height: 1.6; }

        .footer { text-align: center; padding: 24px 0; }
        .footer span { font-size: 12px; color: #4b5563; }
        .footer .deploy-badge { margin-left: 12px; padding: 2px 10px; border-radius: 6px; background: #1c2128; }
      `}</style>
    </div>
  )
}
