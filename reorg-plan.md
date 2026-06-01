# Skill Reorganization Plan (v2 — Jun 2026)

## 目標
將 skills 分類對齊 dashboard System 頁嘅 data source structure，搵嘢快、唔重疊、清楚知道邊個係 primary。

---

## 建議結構

```
data-sources/
├── price-market/
│   ├── fmp.skill.md              ← FMP quotes, OHLCV, profiles (paid primary)
│   └── yahoo-finance.skill.md    ← yfinance fallback
│
├── fundamentals/
│   └── sec-edgar.skill.md        ← 10-K/10-Q/8-K, insider Form 4
│   ※ FMP fundamentals 歸入 fmp skill（跨 category 正常）
│
├── institutional-holdings/
│   └── sec-edgar-13f.skill.md    ← NEW — 13F scraping from EDGAR
│
├── news-sentiment/
│   ├── rss-feed.skill.md         ← 63+ sources broad news
│   ├── finnhub.skill.md          ← ticker-specific news
│   ├── marketaux.skill.md        ← entity-level sentiment
│   ├── tiingo.skill.md           ← ticker-tagged news (future scale-up)
│   └── reddit-data.skill.md      ← retail sentiment
│
├── economic-macro/
│   └── fred.skill.md             ← GDP, CPI, PMI, yield curve
│
├── screening-analytics/
│   ├── stock-screener.skill.md       ← 自動化 Wed+Sat pipeline
│   ├── finviz-stock-screener.skill.md ← Quick filter reference
│   ├── portfolio-monitor.skill.md    ← exposure, concentration
│   ├── risk-calculator.skill.md      ← VaR, drawdown, beta
│   └── stock-deep-dive.skill.md      ← 7-step per-ticker research
│
├── briefing/
│   └── financial-analyst-tasks.skill.md ← Daily AM/PM briefing
│
└── infrastructure/
    └── equity-data-pipeline.skill.md  ← umbrella orchestrator
```

## Keep 原位（唔關 equity data source 事）

| Skill | Category | Reason |
|---|---|---|
| ibkr | openclaw-imports | Trading execution |
| polymarket-api | openclaw-imports | Prediction markets |
| worldmonitor | openclaw-imports | OSINT platform |
| khal-calendar | productivity | Calendar |
| jupyter-live-kernel | data-science | Python dev tool |

## Merge = 0 個（覆檢後全部保留）

| Skill | Reason to Keep |
|---|---|
| finviz-stock-screener | Quick reference screening，同 automated screener 用途唔同 |
| tiingo | 預留未來加量 |
| financial-analyst-tasks | Daily briefing system，同 stock-deep-dive 係兩回事 |

## 搬動次序

1. **Phase 1** — 喺 `data-sources/` 下開 category dirs + `skill_manage(action='edit')` 改 category path
2. **Phase 2** — 寫 `sec-edgar-13f` new skill
3. **Phase 3** — update `equity-data-pipeline` umbrella 入面嘅 reference
