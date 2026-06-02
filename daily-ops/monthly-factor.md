# Monthly Factor Review Pipeline

## 目的
月尾回顧 factor performance — 睇邊個 factor 跑贏/輸，調整 weighting

## Cadence
每月最後一日 6pm HKT (cron)

## Skills Used
| Skill | 用途 | Required |
|-------|------|----------|
| stock-screener | Factor performance review | ✅ |
| portfolio-monitor | Holdings factor exposure | ✅ |
| yahoo-finance | Monthly return data | Optional |

## Steps

### 1. Aggregate Monthly Returns
- Read `daily_prices` → compute monthly returns for S&P 500
- By sector, by factor quintile

### 2. Factor Performance Analysis
- Momentum factor: top quintile vs bottom quintile return
- Value factor: low P/E vs high P/E return
- Quality factor: high ROE vs low ROE return
- Size factor: small cap vs large cap return
- Low-vol factor: low beta vs high beta return

### 3. Portfolio Factor Exposure
- Current holdings → factor loadings
- Compare with benchmark (S&P 500)
- Identify factor tilts (intentional vs drift)

### 4. Output — Discord Summary

```
────────────────────────────────────
📊 Monthly Factor Review | {month} {year}
────────────────────────────────────

🏆 Factor Returns (this month)
  Momentum:  +{x.x}%  (rank: {N}/5)
  Value:     +{x.x}%  (rank: {N}/5)
  Quality:   +{x.x}%  (rank: {N}/5)
  Size:      +{x.x}%  (rank: {N}/5)
  Low-Vol:   +{x.x}%  (rank: {N}/5)

💼 Portfolio Factor Exposure
  Momentum tilt:  {x.x} (neutral: 1.0)
  Value tilt:     {x.x}
  Quality tilt:   {x.x}

📌 Recommendations
  • {factor} overweight — performing well
  • {factor} underweight — consider adjusting
  • {ticker} factor drift detected

────────────────────────────────────
```

## Error Handling
- If `daily_prices` has < 20 trading days data → warn: incomplete month
- If portfolio-monitor not available → skip factor exposure analysis

## DB Tables Read
| Table | Data |
|-------|------|
| `daily_prices` | Monthly return computation |
| `weekly_screening` | Factor score backtesting (optional) |

## Verification
- 5 factors should each have >0 stocks in quintile analysis
- Factor tilt scores should be centered around 1.0 for market-neutral
