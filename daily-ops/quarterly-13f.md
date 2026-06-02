# Quarterly 13F Pipeline

## 目的
追蹤機構持倉變化 — 睇 smart money 買咗/賣咗咩

## Cadence
每季一次 (Mar/Jun/Sep/Dec) — filing deadline 後 1 週 (45日 deadline 後約 mid-month)

## Skills Used
| Skill | 用途 | Required |
|-------|------|----------|
| sec-edgar-13f | Fetch institutional 13F filings | ✅ |

## Steps

### 1. Define Tracked Institutions
- Fixed list of key funds/institutions (e.g. Berkshire, Citadel, Renaissance, Bridgewater, etc.)
- Configurable list — add/remove per quarter

### 2. Fetch 13F Filings
- `sec-edgar-13f(top_institutions=N)` → fetch latest quarter filings
- Compare with previous quarter

### 3. Analyze Changes
- New positions (not in previous quarter)
- Exited positions (no longer held)
- Significant increases (>50% position size)
- Significant decreases (>50% position size)
- Top N new buys across all tracked funds
- Top N sold across all tracked funds

### 4. Output — Discord Summary

```
────────────────────────────────────
🏦 Quarterly 13F Flow | Q{x} {year}
────────────────────────────────────

📈 Most Bought (across tracked funds)
  {ticker}: {N} funds bought, total +{value} shares
  {ticker}: {N} funds bought, total +{value} shares

📉 Most Sold
  {ticker}: {N} funds sold, total -{value} shares
  {ticker}: {N} funds sold, total -{value} shares

🏛 Notable Fund Moves
  Berkshire
    New: {ticker} ({shares})
    Sold: {ticker} ({shares})
  Citadel
    New: {ticker} ({shares})
    Increased: {ticker} +{pct}%

🔍 Overlap with Holdings
  • {ticker} — {N} funds also hold — confirm thesis
  • {ticker} — {N} funds exiting — review position
────────────────────────────────────
```

## Error Handling
- If SEC EDGAR is down → retry daily for 3 days, then skip this quarter
- If individual fund filing missing → skip that fund, log warning

## DB Tables Written
| Table | Data | Retention |
|-------|------|-----------|
| `holder_portfolios` | 13F snapshots per fund per quarter | Permanent |

## Verification
- Expected 10-20 funds fetched per quarter
- Each fund should have 10-50 holdings minimum
- Quarter-over-quarter comparison requires prior snapshot in DB
