# Pipeline Architecture Plan (V2)

## 核心架構

```
data-sources/     → 17 skills (tools — 點 fetch 數據)
                     finnhub, yahoo-finance, rss-feed, marketaux,
                     fred, sec-edgar, sec-edgar-13f, stock-screener,
                     finviz-stock-screener, tiingo, reddit-data,
                     portfolio-monitor, risk-calculator, stock-deep-dive

daily-ops/        → 排程 job (cron)，一條龍 fetch → process → store → report
                     ├── morning-scan    每日 8am HKT (開市前)
                     ├── evening-review   每日 4pm HKT (收市後)
                     ├── weekly-screen   每星期 Wed/Sat
                     ├── monthly-factor  每月尾
                     ├── quarterly-13f   每季 (Mar/Jun/Sep/Dec)
                     └── stock-deep-dive on-demand (user-triggered)
```

**DB storage 係 daily ops 嘅 side effect** — morning scan fetch 完 store 埋，data 自然 accumulate。

唔需要獨立嘅 data pipeline layer。Morning scan + evening review 夾埋 cover 全日 data。

---

## Daily Ops 詳細

### 1. Morning Scan (每日 8am HKT)

**目的：** 開市前 data → morning report
**Cadence:** 每日 (cron)

**Steps:**
1. Fetch S&P 500 pre-market prices (FMP/yahoo-finance)
2. Fetch overnight news summary (RSS + Tiingo + Finnhub + Marketaux)
3. Fetch FRED macro (interest rate, CPI, unemployment)
4. Fetch today's earnings calendar (FMP)
5. **Store all raw data → DB**
6. Analyze:
   - Pre-market movers (top gainers/losers)
   - News sentiment by stock
   - Overnight macro changes
   - Earnings beats/misses today
7. **Output:** morning report (Discord)

**DB records stored:**
- `daily_prices`, `news_summary`, `macro_indicators`, `earnings_calendar`

### 2. Evening Review (每日 4pm HKT)

**目的：** 收市 data → 全日分析
**Cadence:** 每日 (cron)

**Steps:**
1. Fetch S&P 500 closing prices (FMP/yahoo-finance)
2. Fetch intraday/sector performance
3. Fetch today's news roundup (RSS + Tiingo + Finnhub)
4. **Store all raw data → DB**
5. Analyze:
   - Daily % change breakdown
   - Sector rotation
   - Volume anomalies
   - Portfolio holdings P&L
   - Correlation shifts
6. **Output:** evening review (Discord)

**DB records stored:**
- `daily_prices`, `news_summary`

### 3. Weekly Screening (Wed & Sat)

**目的：** 全 market 篩選（Russell 3000）
**Cadence:** 每星期兩次 (cron)

**Steps:**
1. Fetch Russell 3000 prices on-demand → 暫存 `screen_cache`
2. Run stock screener (momentum, value, growth factors)
3. Top picks → store report + vector map
4. 暫存 table clean up / keep 到下星期

**DB records stored:**
- `weekly_screening`, `screen_cache` (暫存)

### 4. Monthly Factor Review (每月尾)

**目的：** 回顧 factor performance
**Cadence:** cron — 每月最後一日

**Steps:**
1. Aggregate daily prices → monthly returns
2. Factor analysis (momentum, value, size, quality)
3. **Output:** monthly factor report

### 5. Quarterly 13F (Mar/Jun/Sep/Dec)

**目的：** 追蹤機構持倉變化
**Cadence:** cron — 每季 (45日 filing deadline 後)

**Steps:**
1. Fetch SEC EDGAR 13F for key funds
2. Compare with previous quarter
3. **Output:** 13F change report

**DB records stored:**
- `holder_portfolios` (only tracked funds)

---

## DB Storage Strategy

### Keep (historical needed for analysis)

| Table | Source | Growth/yr |
|-------|--------|-----------|
| `daily_prices` | S&P 500, FMP | ~10 MB |
| `earnings_calendar` | FMP | ~0.24 MB |
| `macro_indicators` | FRED | ~0.5 MB |
| `news_summary` | RSS + Tiingo + Finnhub + Marketaux | ~5 MB |
| `weekly_screening` | Screener | ~0.5 MB |
| **Total baseline** | | **~16-17 MB/yr** |

### On-demand (fetch when needed, optional store)

| Table | Behaviour |
|-------|-----------|
| `screen_cache` | Russell 3000 raw prices — fetch per screening event, keep 1 week |
| `holder_portfolios` | 13F — fetch per quarter, store only for tracked funds |
| `deep_dive_data` | Per-ticker analysis, store optional |

### Never store

| Data | Why |
|------|-----|
| News body | Summary only — 慳 95% space |
| Russell 3000 (full daily) | 太大，只 screening event 用 |
| Tick-level / intraday | Decision support, 唔需要 |

---

## Roadmap

### Phase 1 ✅ (Done)
- Skill reorganisation → `data-sources/`
- `sec-edgar-13f` skill created
- Pipeline architecture reworked (no separate pipeline layer)

### Phase 2 ✅ (Done)
- `morning-scan.py` — 開市前掃瞄 script, cron @ 8pm HKT (weekdays)
- `evening-review.py` — 美股收市回顧 script, cron @ 8am HKT (weekdays)
- `weekly-screening.py` — 每週篩選 script, cron Wed 10pm + Sat 2pm
- All scripts: no_agent mode (zero LLM cost), Chinese output, DB store
- Report files saved to `daily-ops/reports/`

### Phase 3 — Dashboard + DB
- DB schema (tables above)
- Read-only queries
- Dashboard displays what DB already has
