# 開市前掃瞄 Pipeline

## 目的
美股開市前 fetch pre-market data + 出盤前報告

## Cadence
每日 8pm HKT (開市前 1hr) — cron (weekdays)

## Skills Used
| Skill | 用途 | Required |
|-------|------|----------|
| yahoo-finance | S&P 500 pre-market prices | ✅ |
| rss-feed | Overnight news (last 16h) | ✅ |
| marketaux | Additional news + sentiment | Optional |
| finnhub | Pre-market quotes, earnings calendar | ✅ |
| fred | Latest macro (rate, CPI, unemployment) | ✅ |

## Implementation
### Cron Job
- **Job name:** `morning-scan`
- **Schedule:** `0 12 * * 1-5` (12pm UTC = 8pm HKT, weekdays)
- **Mode:** `no_agent=True` (script runs directly, no LLM cost)
- **Script:** `morning-scan.py`
- **Delivery:** Discord (origin conversation)

### Report Files
- Saved to `daily-ops/reports/morning-scan/YYYY-MM-DD.md`
- Path: `/workspace/daily-ops/reports/morning-scan/`

## Steps

### 1. Fetch Data
- `yahoo-finance` → S&P 500 previous close + pre-market
- `finnhub` → pre-market movers, earnings calendar today
- `rss-feed(hours=16)` → overnight news
- `marketaux(morning)` → supplementary news
- `fred(latest)` → macro indicators

### 2. Store to DB
Tables: `daily_prices`, `news_summary`, `macro_indicators`, `earnings_calendar`

### 3. Analyze (Targeted Only)
**News sentiment — only for:**
- Portfolio holdings (~10-20 stocks)
- Pre-market movers (top 5 up/down)
- Earnings today stocks
- Stocks with overnight news spike

**Expected max:** 20-40 stocks per day

**Sentiment methodology:**
- Marketaux / Finnhub / Tiingo → use native sentiment scores directly
- RSS feed → keyword-based sentiment for relevant stocks only
  - Positive keywords: `beat`, `surge`, `upgrade`, `bullish`, `buy`, `raised`, `growth`, `positive`
  - Negative keywords: `miss`, `plunge`, `downgrade`, `bearish`, `sell`, `cut`, `drop`, `decline`
  - If headline has ticker match + keyword → assign ±1 score
  - If headline has ticker match but no keyword → neutral (0)
  - If no ticker match → skip (not relevant)
- Weighted average per ticker (newer articles weighted higher)

### 4. Output — Discord Summary

```
────────────────────────────────────
🌅 Morning Scan | {date}
────────────────────────────────────

📊 Pre-Market Movers
  ↑ {ticker} +{pct}%  ({reason})
  ...

📰 Overnight News
  • {headline}
  ...

📈 Macro
  • 10Y yield: {value}
  • VIX: {value}

💵 Earnings Today
  • {ticker} — Est: ${value} | Whisper: ${value}

────────────────────────────────────
```

## Error Handling
- If a data source fails → skip that source, log warning, continue
- If all sources fail → output "Morning scan failed — no data available"

## DB Tables Written
| Table | Data | Retention |
|-------|------|-----------|
| `daily_prices` | Pre-market + previous close | Rolling 2yr |
| `news_summary` | Title, source, tickers, sentiment | 30-day TTL |
| `macro_indicators` | Rate, CPI, unemployment | Permanent |
| `earnings_calendar` | Today's earnings | Monthly cleanup |

## Verification
- Report should arrive in Discord by 8:05am
- If no report by 8:15am → check cron job logs
