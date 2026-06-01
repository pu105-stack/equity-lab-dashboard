# Pipeline Architecture Plan

## 設計哲學

```
data-sources/  ← 原子 skills（每個 data source 獨立，做 fetch + return raw data）
     ↓
pipelines/     ← 組合式 workflows（declare steps + params，出結果）
     ↓
output         ← Discord summary / Dashboard / DB record / Alert
```

每個 pipeline = 一個「劇本」，declare 用邊啲 atomic skills + 咩 logic + 咩 output。

---

## Pipeline 清單

### 🏗 Tier 0 — Infrastructure（背景自動）

#### P1: data-ingestion
| | |
|---|---|
| **Cadence** | Daily 23:00 UTC (weekdays) |
| **Steps** | fetch_stocks → fetch_prices → fetch_macro |
| **Output** | PostgreSQL tables: stocks, daily_prices, fundamentals, macro |
| **Triggers** | Time-based cron |

---

### 🌅 Tier 1 — Daily Ops（每個 trading day）

#### P2: morning-scan
| | |
|---|---|
| **Cadence** | 開市前 (~8:30am ET / 8:30pm HKT) |
| **Calls** | rss-feed(hours=16) + marketaux(morning) + fred(latest) + earnings-calendar(today) |
| **Output** | Discord summary: overnight news, watchlist alerts, macro context, earnings today |

#### P3: evening-review
| | |
|---|---|
| **Cadence** | 收市後 (~5pm ET / 5am HKT) |
| **Calls** | rss-feed(hours=8) + portfolio-monitor(snapshot) + risk-calculator(stop-loss) |
| **Output** | Discord summary: session news, portfolio P&L, stop-loss alerts |

---

### 📊 Tier 2 — Weekly / Monthly

#### P4: screening-wed
| | |
|---|---|
| **Cadence** | Wed 14:00 UTC |
| **Calls** | stock-screener(list=1) → sector scan → technicals → fundamentals → score |
| **Output** | Ranked candidates (Track A), Discord post |

#### P5: screening-sat
| | |
|---|---|
| **Cadence** | Sat 14:00 UTC |
| **Calls** | stock-screener(list=both) → full pipeline |
| **Output** | Ranked candidates (Track A + B), Discord post |

#### P6: factor-review
| | |
|---|---|
| **Cadence** | Monthly (last Sat) |
| **Calls** | stock-screener(review) + portfolio-monitor |
| **Output** | Factor hit rates, weight adjustment proposals |

#### P7: macro-direction
| | |
|---|---|
| **Cadence** | Monthly (1st Sat) |
| **Calls** | fred(multi-series) + sector ETF momentum scan |
| **Output** | Macro environment summary, sector rotation signal |

---

### 🔍 Tier 3 — Quarterly / Event-driven

#### P8: deep-review
| | |
|---|---|
| **Cadence** | Quarterly |
| **Calls** | portfolio-monitor + risk-calculator + stock-screener(review, 12wk) |
| **Output** | Portfolio attribution, strategy calibration report |

#### P9: institutional-flow
| | |
|---|---|
| **Cadence** | Quarterly (post-13F deadline) / On-demand |
| **Calls** | sec-edgar-13f(top institutions) → compare vs prev quarter → flag changes |
| **Output** | Discord alert: new buys, exits, significant position changes |

#### P10: stock-deep-dive
| | |
|---|---|
| **Cadence** | On-demand (triggered by screening / user request) |
| **Calls** | stock-deep-dive(ticker) → 7-step research |
| **Output** | Research note .md file |

---

## ⚠️ Data Storage Strategy — Discussion Point

> Oscar嘅問題：每日 fetch 咁多 data 入 DB，會唔會好快爆？有冇必要每樣都儲？

### 現狀（from equity-data-pipeline）

| Table | 而家點做 | Size/yr |
|---|---|---|
| `daily_prices` | 每日 fetch 全部 S&P 500 (~500 stocks) | ~50 MB |
| `news` | 每6小時 fetch 63+ RSS feeds，store 30日 | ~10 MB |
| `fundamentals` | Quarterly snapshots for 500 stocks | ~5 MB |
| `stocks` | S&P 500 universe, permanent | 0.1 MB |
| `screening_runs` | Per run output | ~1 MB |
| **Total** | | **~65 MB/yr** |

### Reality check

65MB/year is **tiny** by database standards. Even 5 years = 325MB. Not a concern.

但 Oscar 嘅思考方向係啱嘅 — **唔係所有 data 都有同等價值**。應該分 tier：

### Proposed: 3-Tier Storage

| Tier | Data | Storage | 點做 |
|------|------|---------|------|
| 🟢 **Must Store** | prices, fundamentals, macro, screening runs | Full data, permanent/rolling | Screening 同 backtest 必需要用 historical data |
| 🟡 **Store Summary** | News | Title + source + tickers + sentiment score only (唔 store body) | Searchable, 夠做 alert/sentiment |
| 🔴 **On-demand Only** | Per-ticker deep dive, 13F holdings, ticker-specific news | 唔 store 落 DB — 即 fetch 即 output | 有需要先拉，用完就算 |

### 具體建議

**1. Prices → Keep full （🟢）**
- 50MB/yr 真係好細
- Screening 同 backtest 需要 historical data
- 用 rolling 2-year purge 已經夠
- 可以考慮只 keep S&P 500，唔使 keep 全部 ~10,000 stocks

**2. News → Store summary only （🟡）**
- Store: `title`, `source`, `published_at`, `tickers[]`, `sentiment_score`
- **唔 store**: `body` / full article text
- 30-day TTL keep
- 如果某隻股需要深入睇 news → on-demand call finnhub / marketaux

**3. Per-ticker deep dives → On-demand only （🔴）**
- `stock-deep-dive` 唔 store 落 DB
- 每次 on-demand call，output 去 .md file
- `institutional-flow` 都係 on-demand，13F 每季先一次

**4. Fundamentals → Keep （🟢）**
- 5MB/yr，permanent，對 valuation 分析好重要

### Summary

| Data Type | 而家 | 建議 |
|-----------|------|------|
| Prices (daily) | ✅ Full, 2yr rolling | ✅ Keep (50MB/yr cheap) |
| News | ✅ Full body, 30d TTL | ⚠️ **Change to summary-only** (title + tickers + sentiment) |
| Fundamentals | ✅ Permanent | ✅ Keep |
| Macro | ✅ Keep | ✅ Keep |
| Screening | ✅ Per run | ✅ Keep |
| Deep dives | ❌ Not stored | ✅ **On-demand only** (correct already) |
| 13F | ❌ Not implemented | ✅ **On-demand only** (quarterly fetch) |
