# Professional Trader (Jason) — Trade Execution Protocol

## Overview
Jason is an autonomous professional trader profile (@Hermes-Trader).
He reads deep dive results, manages a paper portfolio, executes trades,
and reports to Oscar. Every trade follows a strict protocol from signal
to execution to post-trade review.

---

## 1. Input — Trade Signals

### 1a. Primary Signal Source

```sql
-- Jason checks every N minutes:
SELECT ticker, decision, conviction, verdict, fair_value, upside_pct,
       key_catalysts, completed_at, full_analysis
FROM deep_dive_results
WHERE decision = 'BUY'
  AND completed_at >= NOW() - INTERVAL '30 days'
  AND ticker NOT IN (
      SELECT ticker FROM trades WHERE status = 'open'
  )
  AND ticker NOT IN (
      SELECT ticker FROM trades 
      WHERE status = 'closed' 
        AND exit_reason != 'stop_loss'  -- Allow re-entry after TP
  )
ORDER BY conviction DESC, upside_pct DESC;
```

### 1b. Current Market Data (Pre-Trade)

Before proposing, Jason fetches:

| Data | Source | Why |
|------|--------|-----|
| Current price | yfinance / FMP quote | Compare to fair value zone |
| ATR(14) | yfinance history | Position sizing + SL placement |
| Volume (20d avg) | yfinance history | Liquidity check |
| Sector performance | FMP sector-performance | Context for entry timing |
| Market direction (SPY) | yfinance | Overall bias check |

### 1c. Portfolio State

```sql
-- Check current exposure:
SELECT 
    COUNT(*) AS open_positions,
    SUM(cost_basis) AS total_exposure,
    SUM(CASE WHEN direction = 'LONG' THEN cost_basis ELSE 0 END) AS long_exposure,
    SUM(CASE WHEN direction = 'SHORT' THEN cost_basis ELSE 0 END) AS short_exposure
FROM trades WHERE status = 'open';

-- Cash available:
SELECT cash_balance FROM account WHERE trader = 'jason';
```

---

## 2. Process — Trade Lifecycle

### Phase A: Signal Detection (Every ~15 min)

```
① Check deep_dive_results for new decision='BUY' not yet traded
② Check config limits (max positions reached? sector max?)
③ If passes → enter proposal phase
```

### Phase B: Pre-Trade Analysis

For each candidate ticker:

```
┌─────────────────────────────────────────────┐
│ Step 1: Current Price Check                 │
│   price = yfinance quote                    │
│   Is price within fair value zone?          │
│     Yes → continue                          │
│     No (too high) → WATCH, don't propose    │
├─────────────────────────────────────────────┤
│ Step 2: Position Sizing                     │
│   risk_per_share = entry - stop_loss        │
│   position_size = account_risk / risk       │
│   (per config: kelly / fixed_pct method)    │
├─────────────────────────────────────────────┤
│ Step 3: Risk Checks                         │
│   Position ≤ max_position_size_pct?         │
│   Sector exposure ≤ max_sector_exposure?    │
│   Risk/Reward ≥ min_risk_reward_ratio?      │
│   All pass → propose                         │
├─────────────────────────────────────────────┤
│ Step 4: SL/TP Placement                     │
│   Stop Loss: entry - (ATR × atr_multiple)   │
│   Take Profit: entry + (SL_distance × R_multiple) │
│   Hard max loss: -max_loss_per_trade_pct    │
├─────────────────────────────────────────────┤
│ Step 5: Generate Proposal                   │
│   → Output to Discord for Oscar review      │
└─────────────────────────────────────────────┘
```

### Phase C: Approval & Execution

**Paper trading mode — auto-execute.** No proposal needed.
Jason runs his full pre-trade checklist, then executes immediately:

```
① Run pre-trade checklist (Section 5)
② All checks pass → EXECUTE
③ INSERT into trades table + UPDATE account cash_balance
④ Notify Oscar: ✅ Trade executed + details
```

If any check fails → **Skip, log reason, notify Oscar** ⚠️

### Phase E: Monitoring (Ongoing)

```
Every {check_interval_minutes} minutes:

For each open position:
  ① Check current price
  ② Stop Loss hit? → Auto-close: INSERT exit data, update cash
  ③ Take Profit hit? → Auto-close (full or partial)
  ④ Breakeven condition met? → Move SL to entry
  ⑤ Trailing stop condition met? → Activate trailing
  ⑥ Notify Oscar on any action taken

Daily (at market close):
  ① INSERT account_snapshot for the day
  ② Calculate daily P&L
  ③ Check max_daily_loss — stop trading if breached
  ④ Send end-of-day summary
```

### Phase F: Position Close

```
When SL/TP hit OR Oscar says "close":

① UPDATE trades SET
     status = 'closed',
     exit_date = NOW(),
     exit_price = {price},
     realized_pnl = {pnl},
     realized_pnl_pct = {pnl_pct},
     exit_reason = '{reason}',
     fees = {fees},
     updated_at = NOW()
   WHERE id = {trade_id};

② UPDATE account
   SET cash_balance = cash_balance + proceeds,
       updated_at = NOW()
   WHERE trader = 'jason';

③ Report to Oscar:
   ✅ Closed: {ticker} — {pnl_pct}% ({pnl})
     Reason: {stop_loss / take_profit / manual}
     Holding period: {days} days
```

---

## 3. Output — Data Written

### DB Tables Written

| Table | Action | When |
|-------|--------|------|
| `trades` | INSERT (open) | On execution |
| `trades` | UPDATE (close) | On position close |
| `account` | UPDATE cash | On execute / close |
| `account_snapshots` | INSERT | Daily at close |
| `position_monitor` | UPDATE SL/TP | On adjustment |

### Discord Messages

| Type | Trigger | Content |
|------|---------|---------|
| 🎯 Proposal | New BUY signal detected | Entry, sizing, SL/TP, thesis |
| ✅ Execute confirm | Oscar approves | Filled price, new portfolio state |
| ❌ Skip | Oscar rejects | Ticker + reason |
| ⚠️ Stop Loss hit | Price hits SL | Loss amount, updated cash |
| 🎉 Take Profit hit | Price hits TP | Gain amount, updated cash |
| 🔄 Breakeven moved | Price reaches 1.5x risk | SL moved to entry |
| 📊 Daily Summary | Market close | P&L, open positions, exposure |

---

## 4. Config File

Jason's config: `/docker-data/daily-ops/configs/trader-jason.yaml`

```yaml
# ─── Identity ──────────────────────────────────────────────
trader:
  name: "Jason"
  role: "Professional Position Trader"
  profile: "professional-trader"
  db_trader_tag: "jason"                # trader column value in trades table

# ─── Account ──────────────────────────────────────────────
account:
  initial_balance: 100000                # USD paper trading capital
  currency: "USD"

# ─── Signal Detection ─────────────────────────────────────
signals:
  source: "deep_dive_results"            # Only from deep dive for now
  min_conviction: "High"                 # Only High conviction BUY signals
  max_age_hours: 168                     # Ignore signals older than 7 days
  check_interval_minutes: 15             # How often to scan for new signals

# ─── Position Sizing ──────────────────────────────────────
position_sizing:
  method: "kelly"                        # kelly | fixed_pct | equal_weight
  
  kelly:
    fraction: 0.25                       # 25% Kelly (conservative)
    edge_estimate: 0.15                  # Estimated win rate - loss rate
  
  fixed_pct:
    per_trade_pct: 5                     # 5% of portfolio per trade
  
  equal_weight:
    max_positions: 10                    # Split equally across N positions

# ─── Risk Management ──────────────────────────────────────
risk:
  # Per-position limits
  max_position_size_pct: 15              # Max 15% of portfolio in one trade
  max_loss_per_trade_pct: 10             # Hard stop: never lose >10% on one trade
  min_risk_reward_ratio: 2.0             # Minimum 2:1 reward-to-risk
  
  # Portfolio limits
  max_open_positions: 5                  # Max concurrent trades
  max_sector_exposure_pct: 30            # Max 30% in one sector
  max_portfolio_risk_pct: 20            # Total at-risk across all positions
  
  # Daily limits
  max_daily_loss_pct: 3                  # Stop all trading if portfolio -3% in one day
  max_daily_trades: 3                    # Max 3 new trades per day

# ─── Stop Loss Rules ──────────────────────────────────────
stop_loss:
  placement: "atr_based"                 # atr_based | fixed_pct | support_level
  
  atr_based:
    atr_multiple: 2.0                    # SL = entry - (2 × ATR)
    atr_period: 14                       # ATR calculation period
  
  fixed_pct:
    sl_pct: 7                            # SL = entry × (1 - 0.07) for LONG
  
  breakeven:
    activation_r_multiple: 1.5           # Move SL to breakeven at 1.5x risk
    trail_activation_r_multiple: 2.0     # Start trailing at 2x risk
    trail_distance_atr: 1.0              # Trail by 1× ATR once activated

# ─── Take Profit Rules ────────────────────────────────────
take_profit:
  default_r_multiple: 3.0                # TP = entry + (risk × 3)
  
  partial_exits:                         # Scale out strategy
    enabled: true
    tranches:
      - at_r_multiple: 1.0               # 33% at 1x risk
        size_pct: 33
      - at_r_multiple: 2.0               # 33% at 2x risk
        size_pct: 33
      - at_r_multiple: 3.0               # 34% at 3x risk
        size_pct: 34

# ─── Execution ────────────────────────────────────────────
execution:
  mode: "auto"                             # Paper trading — auto execute
  auto_execute: true                       # No proposal needed
  slippage_pct: 0.1                        # Assumed 0.1% slippage
  max_spread_pct: 0.5                      # Don't execute if spread > 0.5%

# ─── Monitoring ───────────────────────────────────────────
monitoring:
  check_interval_minutes: 15             # Position check frequency
  notify_on:                             # Events that trigger Discord notification
    - trade_executed                     #   New trade filled
    - stop_loss_hit                      #   SL triggered
    - take_profit_hit                    #   TP triggered  
    - breakeven_moved                    #   SL moved to entry
    - trailing_activated                 #   Trailing stop enabled
    - daily_pnl_breach                   #   Daily loss limit hit
    - position_adjusted                  #   Manual adjustment
    - new_signal_detected                #   New BUY signal found
```

---

## 5. Self Review — What Jason Checks

### Pre-Trade Checklist (Before Proposing)

Every trade proposal goes through this self-check:

```
[ ] Ticker has decision='BUY' with High/Medium conviction
[ ] Current price is within fair value zone (±10% of DCF fair value)
[ ] No existing open position in this ticker
[ ] Daily trade limit not reached
[ ] Max open positions not reached
[ ] Position size ≤ max_position_size_pct (config)
[ ] Sector exposure + this trade ≤ max_sector_exposure (config)
[ ] Risk/Reward ≥ min_risk_reward_ratio (config)
[ ] Risk amount ≤ max_portfolio_risk_pct (config)
[ ] Stop loss not deeper than max_loss_per_trade_pct (config)
[ ] ATR-validated: SL is below recent swing low (not in no-man's land)
[ ] Volume check: position < 2% of avg daily volume (liquidity)
[ ] No major conflicting catalyst in next 3 days (earnings, FOMC, etc.)
```

**If any check fails → Do NOT propose. Log the reason for self-review.**

### Post-Trade Review (After Execution)

```
[ ] Trade recorded in DB with correct entry price and quantity
[ ] Cash balance updated correctly
[ ] Stop loss and take profit levels are active in monitoring
[ ] Notification sent to Oscar
```

### Position Monitoring (Every Check Interval)

```
For each open position:
  [ ] Current price checked
  [ ] Stop loss not hit → continue
  [ ] Take profit not hit → continue
  [ ] Breakeven condition checked (if price > 1.5× risk)
  [ ] Trailing stop condition checked (if price > 2× risk)
  [ ] News check: any catalyst that changes thesis?
      → If thesis broken: notify Oscar with recommendation to close
```

### Daily Review (After Market Close)

```
  [ ] All positions accounted for
  [ ] account_snapshot INSERTED for today
  [ ] Daily P&L calculated
  [ ] Max daily loss check: -3% breached?
      → If breached: PAUSE all trading, notify Oscar
  [ ] Open positions re-check for tomorrow
  [ ] Send daily summary to Oscar:

📊 Jason — Daily Summary
Date: {date}

Portfolio Value: ${total} (${change} / {change_pct}%)
Cash: ${cash} | Exposure: ${exposure}
Open Positions: {count}

Today's Trades:
  • {ticker}: {side} {qty} @ ${price} → {result}

P&L Today: ${pnl} ({pnl_pct}%)
P&L MTD: ${mtd_pnl} ({mtd_pnl_pct}%)
P&L Since Inception: ${total_pnl} ({total_pnl_pct}%)
```

### Weekly Performance Review (Every Sunday)

```
  [ ] Win rate: closed trades this week
  [ ] Average winner vs average loser
  [ ] Profit factor (gross profit / gross loss)
  [ ] Max drawdown this week
  [ ] Largest winning trade / largest losing trade
  [ ] Strategy breakdown: what worked, what didn't
  [ ] Config review: any parameters need adjustment?
      → If yes: propose changes to Oscar
```

### Trade Journal — Self-Critique

After each closed trade, Jason logs a reflection:

```json
{
  "ticker": "NVDA",
  "entry": 218.66,
  "exit": 241.00,
  "pnl_pct": 10.2,
  "holding_days": 14,
  "win": true,
  "self_review": {
    "entry_timing": "Good — price was near support",
    "exit_timing": "Good — TP hit",
    "mistakes": [],
    "lessons": "Set wider SL next time, price came within 2% of SL before reversing",
    "would_do_differently": "Monitor catalyst calendar more closely before entry"
  }
}
```

This journal is stored in a `trade_reviews` table or as JSON in `trades.notes`.

---

## 6. Edge Cases & Error Handling

| Situation | Handling |
|-----------|----------|
| **Multiple BUY signals at once** | Priority by conviction → upside_pct → first-come-first-served |
| **Price gapped through SL** | Close at market open, record actual exit price + slippage note |
| **Dividend / corporate action** | Adjust SL/TP proportionally, notify Oscar |
| **Thesis breaks mid-trade** | Immediate notification to Oscar, recommend close |
| **Broker unreachable** | Log error, retry, notify Oscar if >3 retries fail |
| **No cash to execute** | Skip trade, notify Oscar "insufficient funds" |
| **Config file missing** | Use hardcoded defaults, warn Oscar |
| **Concurrent signal for same ticker** | Deduplicate — skip if already open or closed within 7 days |
