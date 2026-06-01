# Skill Reorganization Plan (v3 — Jun 2026)

## 結構

```
data-sources/
├── finnhub              ← ticker-specific news (free tier)
├── finviz-stock-screener ← quick reference filter
├── fred                 ← US macro economics
├── marketaux            ← entity-level sentiment scoring
├── portfolio-monitor    ← exposure, concentration, stop-loss
├── reddit-data          ← retail sentiment
├── risk-calculator      ← VaR, drawdown, beta, correlation
├── rss-feed             ← 63+ RSS news feeds
├── sec-edgar            ← 10-K/10-Q/8-K, insider Form 4, 13F
├── stock-deep-dive      ← 7-step per-ticker research
├── stock-screener       ← automated Wed+Sat screening pipeline
├── tiingo               ← smart ticker-tagged news
├── yahoo-finance        ← price history fallback
├── equity-data-pipeline ← 淨 fetch: 拉 stocks, prices, news, macro 入 DB
├── equity-analytics     ← 🆕 分析: screening, portfolio, strategy review
└── financial-analyst-tasks ← daily AM/EOD briefing orchestrator

Keep 原位 (5):
  openclaw-imports/  ibkr, polymarket-api, worldmonitor
  productivity/      khal-calendar
  data-science/      jupyter-live-kernel
```

## Phase 進度

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | ✅ Done | 15 skills → data-sources/ flat, tools.py fixes, dependency wrapper |
| Phase 1b | 🔜 Doing | Split equity-data-pipeline → fetch only + create equity-analytics |
| Phase 2 | ⏳ Pending | Write sec-edgar-13f skill (CIK lookup → 13F XML parse) |
| Phase 3 | ⏳ Pending | Update equity-data-pipeline SKILL.md references + dashboard align |
