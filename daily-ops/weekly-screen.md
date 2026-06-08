# Weekly Screen Pipeline (📊 → weekly_screen DB)

## Trigger
- **Sat 6am HKT**

## Input (Past 7 days)
| Source | Why |
|--------|-----|
| `pipeline_reports` DB (PRIMARY) | Morning/Evening analysis — 睇返之前嘅 calls |
| `/docker-data/news-curator/news-summary-*.md` | All .md from past 7 days via `find -newermt` |
| `news_summary` DB | Raw headlines + sentiment |

## Process
1. Read all 3 input sources
2. Classify tickers: 🎯機會 / 📡值得關注 / ⚠️風險
   - One ticker = one category only
   - If upside+downside → 📡

## Output
| Destination | Format | Purpose |
|------------|--------|---------|
| `weekly_screen` DB | INSERT (ticker, category, reasoning, catalyst, theme) | Source of truth |
| `daily-ops.json` | Full entry (pipeline: `每週篩選`) | Dashboard display |
| `deep-dive-decisions.json` | Synced via `update-dash --sync-only` | Candidate page |
| Git push (via `update-dash --sync-only`) | — | Vercel auto-deploy |

## Key Rules
- 5–12 picks total
- Each ticker must have reasoning
- Call `update-dashboard.py weekly-screen success --sync-only` as last step
- This triggers: `sync_deep_dive_decisions()` + `sync_deep_dive_results()`

## Cron
```bash
# 0 6 * * 6
```
