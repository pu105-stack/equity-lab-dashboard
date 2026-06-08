# Morning Scan Pipeline (🌅 → pipeline_reports + daily-ops.json)

## Trigger
- Mon–Fri **8:30pm HKT** (30min after NC#1)

## Input
1. **Primary**: Latest `/docker-data/news-curator/news-summary-*.md`
   - Parse timestamp from filename → check if < 10h old
   - If stale/absent → **STOP**: "Run News Curator first"
2. Secondary: daily-ops.json (previous pipeline runs)

## Process
1. Read News Curator .md → consolidate ACTION/WATCH items
2. Analyse: overnight market, sector watch, pre-market opportunities, today's agenda

## Output
| Destination | Format | Purpose |
|------------|--------|---------|
| `daily-ops.json` | Full entry (pipeline: `開市掃瞄`) | Dashboard display |
| `pipeline_reports` DB | Analysis text + 384-dim embedding (fastembed) | Historical search / RAG |
| Git push (via `update-dash --sync-only`) | — | Vercel auto-deploy |

## Key Rules
- Opinionated, Traditional Chinese
- **NO holdings data** — not a portfolio tracker
- Call `update-dashboard.py morning-scan success --sync-only` as last step

## Cron
```bash
# 30 20 * * 1-5
```
