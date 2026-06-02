# 美股收市回顧 Pipeline

## 目的
美股收市後 fetch 全日 close data + 分析 + 出收市報告

## Cadence
每日 8am HKT (美股收市後) — cron (weekdays)

## Skills Used
| Skill | 用途 | Required |
|-------|------|----------|
| yahoo-finance | Closing prices S&P 500 | ✅ |
| rss-feed | Today's news roundup (last 8h) | ✅ |
| finnhub | 收市 quotes, sector performance | ✅ |
| fred | Macro snapshot | ✅ |

## Implementation
### Cron Job
- **Job name:** `evening-review`
- **Schedule:** `0 0 * * 1-5` (midnight UTC = 8am HKT, weekdays)
- **Mode:** `no_agent=True` (script runs directly, no LLM cost)
- **Script:** `evening-review.py`
- **Delivery:** Discord (origin conversation)

### Report Files
- Saved to `daily-ops/reports/evening-review/YYYY-MM-DD.md`
- Path: `/workspace/daily-ops/reports/evening-review/`

## Steps

### 1. Fetch Data
- `yahoo-finance` → S&P 500 closing prices (full day)
- `rss-feed(hours=8)` → today's news
- `tiingo` → sector performance intraday (optional)
- `finnhub` → after-hours movers (optional)
- `portfolio-monitor` → P&L snapshot
- `risk-calculator` → stop-loss / drawdown scan

### 2. Store to DB
Tables: `daily_prices`, `news_summary`

### 3. Analyze (Targeted)
**News sentiment — only for:**
- Portfolio holdings
- Top 5 daily movers
- Stocks with unusual volume

**Sentiment methodology:**
- Marketaux / Finnhub / Tiingo → use native sentiment scores directly
- RSS feed → keyword-based sentiment for relevant stocks only (same keyword list as morning-scan)
- Weighted average per ticker (newer articles weighted higher)

**Daily analysis:**
- Top 10 gainers/losers in S&P 500
- Sector rotation (which sectors up/down most)
- Volume anomalies (>2x average)
- Portfolio holdings daily P&L
- Correlation matrix changes (rolling 30d vs benchmark)

### 4. Output — Discord Summary

```
────────────────────────────────────
🌆 Evening Review | {date}
────────────────────────────────────

📊 Market Close
  S&P 500: {level} ({change}%)
  Volume: {volume} ({vs avg})

🏆 Top Gainers / Losers
  ↑ {ticker} +{pct}%  ({reason})
  ↓ {ticker} -{pct}%  ({reason})

📰 Today's News
  • {headline}
  ...

🏭 Sector Performance
  {sector}: {pct}%

💼 Portfolio P&L
  Today: {pct}% | MTD: {pct}%
  Holdings: {ticker} {pct}%, ...

⚠️ Risk Alerts
  • {ticker} stop-loss triggered
  • {ticker} -{pct}% drawdown > threshold

────────────────────────────────────
```

## Error Handling
- If a data source fails → skip that source, log warning, continue
- If all sources fail → output "Evening review failed — no data available"

## DB Tables Written
| Table | Data | Retention |
|-------|------|-----------|
| `daily_prices` | Closing prices | Rolling 2yr |
| `news_summary` | Title, source, tickers, sentiment | 30-day TTL |

## Verification
- Report should arrive in Discord by 4:05pm
- P&L numbers should match portfolio-monitor output
