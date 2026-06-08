# Pipeline Architecture Reference

## Overview

```
Data Sources → Pipeline Processing → Storage → Display
```

All 5 active pipelines, their inputs, outputs, and data flow.

---

## Pipeline Flow Diagram

```
                    ┌─ news_summary DB
NC#1 (8pm) ────────┼─ daily-ops.json
NC#2 (8am) ────────┼─ /docker-data/news-curator/*.md
                    └─ ❌ NO git push, NO pipeline_reports

                         ┌─ /docker-data/news-curator/*.md (stale >10h → STOP)
Morning Scan (8:30pm) ───┼─ daily-ops.json
                          ├─ pipeline_reports w/embedding
                          └─ update-dash.py --sync-only ✅ (pushes NC + MRN)

                           ┌─ /docker-data/news-curator/*.md (stale >10h → STOP)
Evening Review (8:30am) ───┼─ daily-ops.json
                            ├─ pipeline_reports w/embedding
                            └─ update-dash.py --sync-only ✅ (pushes NC + EVE)

                           ┌─ pipeline_reports (7d)
                           ├─ news_summary (7d)
Weekly Screen (Sat 6am) ───┼─ news-curator/*.md (7d)
                            ├─ weekly_screen DB
                            ├─ daily-ops.json
                            └─ update-dash.py --sync-only ✅ (sync decisions+results)

                           ┌─ sync decisions → find deep_dive tickers
                           ├─ delegate_task → subagent (8-phase analysis)
Deep Dive (12/15/18/21) ───┼─ deep_dive_results DB INSERT
                            ├─ pipeline_reports w/embedding INSERT
                            ├─ weekly_screen status='done' UPDATE
                            └─ update-dash.py --sync-only ✅ (sync results+decisions+push)
```

---

## Schedules (HKT)

| Pipeline | Day | Time | Next After |
|----------|-----|------|------------|
| News Curator #1 | Mon–Fri | 8:00pm | — |
| **Morning Scan** | Mon–Fri | **8:30pm** | NC#1 +30min |
| News Curator #2 | Mon–Fri | 8:00am | — |
| **Evening Review** | Mon–Fri | **8:30am** | NC#2 +30min |
| Weekly Screen | Sat | 6:00am | — |
| Deep Dive Polling | Daily | 12/15/18/21 | Every 3h |

---

## DB Tables

| Table | Purpose | Written By |
|-------|---------|------------|
| `news_summary` | Raw headlines + sentiment | News Curator |
| `weekly_screen` | Ticker picks + classification | Weekly Screen |
| `deep_dive_results` | Full deep dive analysis | Deep Dive subagent |
| `pipeline_reports` | Analysis text + 384-dim embedding | Morning Scan, Evening Review, Deep Dive |
| `daily_prices` | Daily price snapshots | Morning/Evening (FMP/yfinance) |

---

## Key Files

| File | Purpose | Updated By |
|------|---------|------------|
| `data/daily-ops.json` | Dashboard display | All pipelines (direct write) |
| `data/deep-dive-decisions.json` | Candidate queue display | `update-dashboard.py --sync-only` |
| `public/data/deep-dive-results.json` | Completed results display | `update-dashboard.py --sync-only` |
| `/docker-data/news-curator/*.md` | Pipeline handoff (NC→Morning/Evening) | News Curator |
| `scripts/update-dashboard.py` | Post-pipeline sync+push handler | Called by Morning/Evening/Weekly/Deep Dive |

## Principles
1. **DB is source of truth** — JSON files are display layer only
2. **Every pipeline writes to DB first**, then syncs to JSON
3. **News Curator does NOT push** — waits for review pipeline
4. **Morning/Evening check staleness** (>10h → trigger NC first)
5. **Weekly Screen syncs decisions+results** via update-dashboard.py
6. **Deep Dive writes DB → update-dash --sync-only** (subagent last step)
