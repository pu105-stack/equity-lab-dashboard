# News Curator Pipeline (📰 → news_summary DB + .md file)

## Trigger
- **NC#1**: Mon–Fri 8pm HKT (Asian/European session)
- **NC#2**: Mon–Fri 8am HKT (US close + overnight)

## Input
- 56 RSS feeds (~500–900 articles via `rss-feed` skill)

## Process
1. Fetch RSS → `/tmp/rss_raw.json`
2. AI curate: **ACTION** / **WATCH** / **NOTE** per headline

## Output
| Destination | Format | Purpose |
|------------|--------|---------|
| `news_summary` DB | Each headline as row (ticker, sentiment, url) | Historical search |
| `daily-ops.json` | Full entry: pipeline, opportunities, my_take | Dashboard display |
| `/docker-data/news-curator/news-summary-{ts}.md` | Markdown summary | Pipeline handoff (Morning/Evening reads this) |

## Key Rules
- **NO git push** — waits for Morning/Evening to push both
- **NO pipeline_reports writes** — news_summary only
- CT模式：ACTION/WATCH/NOTE/SKIP

## Cron
```bash
# NC#1: 0 20 * * 1-5
# NC#2: 0 8 * * 1-5
```
