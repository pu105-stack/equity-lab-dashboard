# 🏦 Equity Lab Dashboard — Daily Ops

> HK/US 量化分析系統 | 美股時間為準
> Auto-deploy via Vercel → [oscary.space](https://oscary.space)

---

## 🚀 Daily Schedule (weekdays HKT)

```
8pm ──┬── 🌅 Morning Scan         → set context for US session
       └── 📰 News Curator #1      → 亞洲/歐洲 news 搵機會

           ↓ US session (9:30pm-4:30am) ↓

8am ──┬── 🌆 Evening Review       → 收市 post-mortem + P&L
       └── 📰 News Curator #2      → US session news 搵機會
```

| 時間 (HKT) | Pipeline | 角色 | 目的 |
|-----------|----------|------|------|
| 🌅 **8pm** | 開市前掃瞄 | Morning Strategist | Pre-market context, macro, 今日 focus |
| 📰 **8pm** | 新聞分析-NewsCurator #1 | Research Analyst | 亞洲/歐洲新聞 → 搵投資機會 |
| 🌆 **8am** | 美股收市回顧 | Evening Analyst | Post-mortem, P&L, forward look |
| 📰 **8am** | 新聞分析-NewsCurator #2 | Research Analyst | US session 新聞 → 搵投資機會 |
| 📊 **Wed 10pm / Sat 2pm** | 每週篩選 | Quant Screener | Russell 3000 factor screening |

**各司其職，output 獨立儲存。將來 Decision Pipeline 會讀取所有 output 做買賣建議。**

**Output:** Discord DM (origin) + 儲存到 daily-ops.json (dashboard 顯示)

---

## 🗄️ PostgreSQL Schema (equity-db)

| Table | Data | Retention |
|-------|------|-----------|
| `daily_prices` | S&P 500 daily OHLCV | Rolling 2yr |
| `news_summary` | Title, source, tickers, sentiment | 30-day TTL |
| `macro_indicators` | FRED (10Y, 2Y, Fed, VIX) | Permanent |
| `earnings_calendar` | Earnings dates + estimates | Monthly cleanup |
| `weekly_screening` | Screening candidates | Permanent |
| `screen_cache` | Russell 3000 prices (temp) | Per-run |
| `holder_portfolios` | 13F snapshots | Permanent |

**Connection:** `host.docker.internal:5432` | User: `tradus371`

---

## 📁 Project Structure

```
daily-ops/
├── morning-scan.md        # 開市前掃瞄 pipeline spec
├── morning-scan.py        # 開市前掃瞄 script (no_agent)
├── evening-review.md      # 美股收市回顧 pipeline spec
├── evening-review.py      # 美股收市回顧 script (no_agent)
├── weekly-screen.md       # 每週篩選 pipeline spec
├── weekly-screening.py    # 每週篩選 script (no_agent)
├── pipeline-plan.md       # 整體架構 overview
├── reports/
│   ├── 開市前掃瞄/
│   ├── 美股收市回顧/
│   └── 每週篩選/
data-sources/              # 17 Hermes skills (API wrappers)
```

---

## 🛠️ Built With

- **Hermes Agent** — cron orchestration + skill system
- **PostgreSQL** — local (host.docker.internal)
- **Vercel** — dashboard hosting
- **Finnhub / Yahoo Finance / FRED / Marketaux / RSS** — data sources
