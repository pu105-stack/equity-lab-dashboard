# Evening Review Pipeline (🌆 → pipeline_reports + daily-ops.json)

## Trigger
- Mon–Fri **8:30am HKT** (30min after NC#2)

## Input
1. **Primary**: Latest `/docker-data/news-curator/news-summary-*.md`
   - Parse timestamp from filename → check if < 10h old
   - If stale/absent → **STOP**: "Run News Curator first"
2. Morning Scan entry from daily-ops.json (did thesis play out?)

## Process
1. Read News Curator .md → consolidate
2. Post-mortem: market recap, notable movers, news that mattered
3. Forward-looking: opportunities carry forward, watchlist

## Output
| Destination | Format | Purpose |
|------------|--------|---------|
| `daily-ops.json` | Full entry (pipeline: `美股收市回顧`) | Dashboard display |
| `pipeline_reports` DB | Analysis text + 384-dim embedding (fastembed) | Historical search / RAG |
| Git push (via `update-dash --sync-only`) | — | Vercel auto-deploy |

## Key Rules
- Forward-looking (not just recap), Traditional Chinese
- **NO holdings data**
- Call `update-dashboard.py evening-review success --sync-only` as last step

## Cron
```bash
# 30 8 * * 1-5
```
