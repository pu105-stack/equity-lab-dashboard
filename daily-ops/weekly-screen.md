# 每週篩選 Pipeline

## 目的
全市場 factor-based screening — Russell 3000 → 候選 stocks

## Cadence
- **Wed 10pm HKT (Track A only):** 增長動能 + 技術指標
- **Sat 2pm HKT (Track A + B):** Track A + 高Beta/事件驅動

## Implementation
### Cron Jobs
| Job | Schedule (UTC) | HKT | Track |
|-----|---------------|-----|-------|
| `每週篩選-Wed` | `0 14 * * 3` | Wed 10pm | A only (`--list 1`) |
| `每週篩選-Sat` | `0 6 * * 6` | Sat 2pm | A+B (`--list both`) |

- **Mode:** `no_agent=True` (script runs directly)
- **Script:** `weekly-screening.py`
- **Delivery:** Discord (origin conversation)

### Report Files
- Saved to `daily-ops/reports/每週篩選/YYYY-MM-DD.md`

## Screening Engine
Uses `stock-screener` skill's built-in pipeline (pure Python, no LLM calls):

1. **Sector scan** — 11 ETFs ranked by 1w+1m momentum → top 4 sectors
2. **Universe** — S&P 500 (hot sectors) + watchlist + high-beta screener
3. **Technicals** — RSI, MACD, SMA(20/50/200), ADX, OBV, ATR, Bollinger
4. **Fundamentals** — P/E, P/B, ROE, debt/equity, revenue growth, FCF
5. **News** — VADER sentiment per ticker
6. **Insider clusters** — EDGAR Form 4 sweep (3+ officers, $50K+, 14 days)
7. **Finviz** — Short float %, 52-week high proximity
8. **Score + rank** — Weighted template scoring → top 7 (Track A) + top 5 (Track B)

## Scoring
| | Track A — 增長動能 | Track B — 高Beta |
|---|---|---|
| Position size | 5-10% | 1-3% |
| Templates | quality_growth, value, momentum, PEAD | breakout, catalyst, short_squeeze |
| Max candidates | 7 | 5 |
| Min score | 1.5 | 1.5 |

## Output — Discord Summary

```
────────────────────────────────────
📊 每週篩選 | 2026-06-03
   Track A (增長動能)
────────────────────────────────────

📋 篩選概覽
  熱門板塊: Technology | Healthcare | Financials
  篩選範圍: 87 隻 (Track A) | 124 隻 (Track B)
  入選: Track A 7 隻 | Track B 3 隻

🏆 Track A — 增長動能 (5-10%)
  1. CRWD — 評分: 2.8
     板塊: Technology
     訊號: quality_growth, momentum, insider_cluster
     RSI: 58 | ADX: 28 | >200MA: ✅ | 量比: 1.4x
     止蝕: -7.2%

  2. ...

🔥 Track B — 高Beta (1-3%)
  1. XYZ — 評分: 2.1
     板塊: Healthcare
     RSI: 62 | Short%: 12% | 催化劑: upgrade
     止蝕: -8.5%

📊 板塊分佈
  Technology: ████ (4隻)
  Healthcare: ██ (2隻)
  Financials: █ (1隻)

────────────────────────────────────
```

## Error Handling
- Screening timeout → retry once, then skip this week
- If stock-screener skill fails → log error, no report

## DB Tables
| Table | Data | Retention |
|-------|------|-----------|
| `weekly_screening` | Screened candidates | Permanent |
| `screen_cache` | Russell 3000 raw prices | Temporary (refresh per run) |

## Verification
- Expected: Track A ~5-7 candidates, Track B ~3-5 candidates
- Track B should add fundamentally different picks vs Track A alone
