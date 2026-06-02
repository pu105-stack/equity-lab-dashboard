# 🏦 Equity Lab Dashboard — Daily Ops

> HK/US 量化分析系統 | 美股時間為準
> Auto-deploy via Vercel → [oscary.space](https://oscary.space)

---

## 🚀 Cron Jobs (全部 weekdays)

| 時間 (HKT) | Job | 做咩 | Script |
|-----------|-----|------|--------|
| 🌅 **8pm** (US開市前1hr) | 開市前掃瞄 | Pre-market, sentiment, macro, 今日焦點 | `morning-scan.py` |
| 🌆 **8am** (US收市後) | 美股收市回顧 | Close data, sector, portfolio, news | `evening-review.py` |
| 📊 **Wed 10pm / Sat 2pm** | 每週篩選 | Russell 3000 factor screening | `weekly-screening.py` |

**Output:** Discord DM (origin) + report file (`daily-ops/reports/`)

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
