# Professional Trader (Jason) — Project Plan

## Overview
Jason (@Hermes-Trader) is an autonomous professional trader profile.
He reads deep dive results from the DB, proposes and executes paper trades,
maintains his own portfolio, and reports to Oscar.

---

## 1. Trigger — How Jason Knows What to Trade

**Phase 1 (Now): Auto-detect BUY from Deep Dive**
- Jason checks `deep_dive_results` DB every N hours
- Finds tickers where `decision = 'BUY'` and not yet traded
- Proposes a trade plan → Oscar reviews → executes or adjusts

**Gap / Future discussion with Jason:**
- What if multiple BUY signals at once? Priority?
- What about WATCH → upgrade to BUY later?
- Does Jason only trade BUY from deep dive, or also his own analysis?
- Weekly Screen picks that never got deep dived?

---

## 2. Trade Execution Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. Jason checks deep_dive_results for decision='BUY'    │
│    (also checks trades table to avoid duplicates)       │
├─────────────────────────────────────────────────────────┤
│ 2. Jason reads current price (yfinance/FMP)             │
│    Checks if still within fair value zone               │
├─────────────────────────────────────────────────────────┤
│ 3. Jason proposes trade via Discord:                    │
│    "🎯 NVDA — BUY 100 shares @ $218.66                  │
│     Stop: $196.79 (-10%) | Target: $306.12 (+40%)       │
│     Risk: $2,187 | Conviction: High"                    │
├─────────────────────────────────────────────────────────┤
│ 4. Oscar reviews → replies: "execute" / "adjust" / "skip"│
├─────────────────────────────────────────────────────────┤
│ 5. Jason executes: INSERT into trades table,            │
│    UPDATE account cash_balance,                          │
│    Reports confirmation to Oscar                         │
└─────────────────────────────────────────────────────────┘
```

**Auto-execute mode (Phase 2):**
- Jason can auto-execute if within predefined parameters
- Still reports to Oscar after execution

---

## 3. Database Schema

### trades — 每筆買賣紀錄

```sql
CREATE TABLE trades (
    id              SERIAL PRIMARY KEY,
    trader          VARCHAR(20) NOT NULL DEFAULT 'jason',
    
    -- Trade info
    ticker          VARCHAR(10) NOT NULL,
    direction       VARCHAR(4) NOT NULL CHECK (direction IN ('LONG', 'SHORT')),
    strategy        VARCHAR(20) DEFAULT 'position',      -- position, swing, scalp
    status          VARCHAR(10) NOT NULL DEFAULT 'open'
                        CHECK (status IN ('pending', 'open', 'closed', 'cancelled')),
    
    -- Entry
    entry_date      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    entry_price     DECIMAL(12,4) NOT NULL,
    quantity        INTEGER NOT NULL,
    cost_basis      DECIMAL(14,2) GENERATED ALWAYS AS (entry_price * quantity) STORED,
    
    -- Exit
    exit_date       TIMESTAMPTZ,
    exit_price      DECIMAL(12,4),
    gross_proceed   DECIMAL(14,2) GENERATED ALWAYS AS (exit_price * quantity) STORED,
    
    -- SL/TP
    stop_loss       DECIMAL(12,4),
    take_profit     DECIMAL(12,4),
    
    -- P&L
    realized_pnl    DECIMAL(14,2) DEFAULT 0,
    realized_pnl_pct DECIMAL(6,2) DEFAULT 0,
    fees            DECIMAL(10,2) DEFAULT 0,
    net_pnl         DECIMAL(14,2) GENERATED ALWAYS AS (realized_pnl - fees) STORED,
    
    -- Source & notes
    deep_dive_id    INTEGER REFERENCES deep_dive_results(id),
    reason          TEXT,       -- Why this trade (link to deep dive thesis)
    exit_reason     TEXT,       -- Why closed (TP hit / SL hit / manual / changed thesis)
    tags            TEXT[],     -- e.g. {'AI', 'momentum', 'earnings'}
    notes           TEXT,
    
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### account — 資金帳戶

```sql
CREATE TABLE account (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(50) NOT NULL DEFAULT 'Paper Trading',
    trader          VARCHAR(20) NOT NULL DEFAULT 'jason',
    initial_balance DECIMAL(14,2) NOT NULL DEFAULT 100000.00,
    cash_balance    DECIMAL(14,2) NOT NULL DEFAULT 100000.00,
    total_deposits  DECIMAL(14,2) NOT NULL DEFAULT 100000.00,
    total_withdrawals DECIMAL(14,2) NOT NULL DEFAULT 0,
    currency        VARCHAR(3) NOT NULL DEFAULT 'USD',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### account_snapshots — 每日資金變化

```sql
CREATE TABLE account_snapshots (
    id              SERIAL PRIMARY KEY,
    account_id      INTEGER REFERENCES account(id),
    snapshot_date   DATE NOT NULL DEFAULT CURRENT_DATE,
    cash_balance    DECIMAL(14,2),
    market_value    DECIMAL(14,2),    -- Sum of open positions market value
    total_value     DECIMAL(14,2),    -- cash + market value
    daily_pnl       DECIMAL(14,2),
    total_return_pct DECIMAL(6,2),    -- Since inception
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(account_id, snapshot_date)
);
```

### portfolio view — 即時持倉

```sql
CREATE VIEW portfolio AS
SELECT 
    t.ticker,
    t.direction,
    SUM(t.quantity) AS quantity,
    AVG(t.entry_price) AS avg_entry,
    -- market_value from latest price
    -- unrealized_pnl
FROM trades t
WHERE t.status = 'open'
GROUP BY t.ticker, t.direction;
```

---

## 4. Config File (Jason-controlled)

Jason has his own config at `/docker-data/daily-ops/configs/trader-jason.yaml`:

```yaml
# /docker-data/daily-ops/configs/trader-jason.yaml

trader:
  name: "Jason"
  profile: "professional-trader"
  
account:
  initial_balance: 100000    # USD paper trading
  
risk:
  max_position_size_pct: 15     # Per trade: max 15% of portfolio
  max_open_positions: 5          # Max concurrent open trades
  max_sector_exposure_pct: 30   # Per sector: max 30%
  max_daily_loss_pct: 3         # Stop all trading if -3% in a day
  max_portfolio_risk_pct: 20    # Total portfolio at risk
  min_risk_reward_ratio: 2.0    # Minimum 2:1 R/R
  
position_sizing:
  method: "kelly"               # kelly, fixed_pct, equal_weight
  kelly_fraction: 0.25          # 25% Kelly (conservative)
  fixed_pct: 5                  # If fixed_pct: 5% per trade
  
stop_loss:
  default_atr_multiple: 2.0     # 2x ATR(14)
  max_loss_per_trade_pct: 10    # Hard max -10% per trade
  breakeven_at: 1.5             # Move SL to breakeven at 1.5x risk
  trailing_stop_activation: 2.0 # Start trailing at 2x risk
  
take_profit:
  default_r_multiple: 3.0       # 3x risk
  partial_at:                    # Scale out
    1: 0.33                      # 33% at 1x risk
    2: 0.33                      # 33% at 2x risk
    3: 0.34                      # 34% at 3x risk
    
execution:
  auto_execute: false           # Phase 2: auto-execute within params
  slippage_pct: 0.1             # 0.1% slippage assumption
  max_spread_pct: 0.5           # Max 0.5% spread to execute
  
monitoring:
  check_interval_minutes: 15    # How often to check open positions
  notify_on:                    # When to notify Oscar
    - trade_executed
    - stop_loss_hit
    - take_profit_hit
    - daily_pnl_breach
    - new_signal_detected
```

---

## 5. Scripts to Build

| Script | Purpose |
|--------|---------|
| `scripts/trades_db.py` | ✅ Exists — CRUD for trades table |
| `scripts/trader_engine.py` | ❌ New — Jason's main loop: check signals → propose → execute |
| `scripts/position_monitor.py` | ✅ Exists — SL/TP check + breakeven |
| `scripts/portfolio_report.py` | ❌ New — portfolio summary + P&L + snapshots |
| `configs/trader-jason.yaml` | ❌ New — Jason's own config file |

---

## 6. Implementation Order

| Phase | Items | Output |
|-------|-------|--------|
| **Phase 1: DB & Config** | Create new tables (account, account_snapshots), update trades table, create config | DB ready for paper trading |
| **Phase 2: Engine** | trader_engine.py: detect BUY → propose trade → wait approval → execute → log | Jason can take first trade |
| **Phase 3: Monitor** | position_monitor.py upgrades: auto SL/TP check, portfolio report, daily snapshots | Active risk management |
| **Phase 4: Portfolio** | portfolio_report.py: P&L, drawdown, win rate, Sharpe, equity curve | Performance tracking |
