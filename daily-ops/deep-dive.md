# Deep Dive Pipeline (🔬 → deep_dive_results + pipeline_reports)

## Trigger
- **Every 3h: 12/15/18/21 HKT** (deep-dive-polling cron)

## Input
| Step | Source | What |
|------|--------|------|
| Step 0 | Vercel API → `sync-deep-dive-decisions.py` | Oscar's skip/deep_dive/done choices |
| Step 1 | `data/deep-dive-decisions.json` | Tickers with `status='deep_dive'` |
| Step 2 | `deep_dive_results` DB | Exclude already-analysed |
| Step 3 | `delegate_task` subagent + FMP/yfinance/SEC | 8-phase analysis |

## Process (Subagent — 8 phases, ~30–45min/ticker)
```
Phase 1: Business Model & Moat
Phase 2: Financial Quality (ROIC, FCF, margins)
Phase 3: Management & Governance (insider activity)
Phase 4: Catalysts & Triggers
Phase 5: Valuation & Scenario (DCF + comps)
Phase 6: Risk/Reward Assessment
Phase 7: Decision — BUY / WATCH / PASS
Phase 8: Post-analysis storage
```

## Output
| Destination | What | How |
|------------|------|-----|
| `deep_dive_results` DB | decision, conviction, verdict, full_analysis, fair_value, upside_pct, key_catalysts, completed_at | Step 8b INSERT |
| `pipeline_reports` DB | full_analysis text + 384-dim embedding (fastembed) | Step 8b INSERT |
| `weekly_screen` DB | `deep_dive_status='done'`, `done_at=NOW()` | Step 8b UPDATE |
| `public/data/deep-dive-results.json` | Auto-synced from DB | Step 8a: `update-dash --sync-only` |
| `data/deep-dive-decisions.json` | Auto-synced (removes done ticker) | Step 8a: `update-dash --sync-only` |
| Git push | Vercel auto-deploy | Step 8a: `update-dash --sync-only` |

## Storage Flow
```
Subagent 8b → DB INSERT/UPDATE
           → python3 update-dashboard.py deep-dive success --sync-only
                ├─ sync_deep_dive_results()    ← DB → public/data/results.json
                ├─ sync_deep_dive_decisions()  ← DB → decisions.json (remove done)
                └─ git push                    ← Vercel auto-deploy
```

## Key Rules
- Each ticker independent — no comparisons
- Must have BUY/WATCH/PASS conclusion
- If BUY: suggest fair value zone + thesis + risk level only
- Position sizing belongs to Professional Trader (Jason)
- Traditional Chinese output

## Cron
```bash
# 0 12,15,18,21 * * *
```
