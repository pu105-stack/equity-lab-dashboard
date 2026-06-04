# Pipeline Architecture Plan (V3)

## 核心哲學 — 各司其職

```
Trading Desk = Maya (Commander)
                  │
  ┌───────────────┼───────────────┐
  │               │               │
Morning Scan   News Curator   Evening Review
(context)      (opportunity)  (post-mortem)
  │               │               │
  └───────────────┼───────────────┘
                  ↓
      ┌──────────────────────┐
      │  Weekly Screen (Sat) │ ← NEW
      │  「邊啲值得再睇？」   │
      └──────────┬───────────┘
                 ↓ (你揀 tickers)
      ┌──────────────────────┐
      │ Deep Dive (on-demand)│ ← NEW
      │ 逐隻 full analysis  │
      └──────────────────────┘
                 ↓
      [Future] Paper Trade Agent
```

**原則：**
- Summarize 係基本盤，core = 搵投資機會
- 唔係 keyword filter，係 AI judgment
- 每個 pipeline output 獨立留底 → 將來 Paper Trade Agent 用
- 唔 consolidate pipelines（context length）

---

## Pipeline 詳細

### 1. Morning Scan（開市前掃瞄）
**⏰ 每日 8pm HKT（US 開市前）**

**角色：** Context setter — 今日 market 係咩環境

**Data source:** yahoo-finance, fred, rss-feed, marketaux, finnhub

**Core value:**
- SPY trend, VIX, macro snapshot
- 今日 themes / catalysts
- 風險 level

**Output:** Discord + `daily-ops.json` → git push → Vercel

---

### 2. News Curator #1 & #2（新聞分析）
**⏰ #1: 每日 8pm HKT（亞洲/歐洲 session）**
**⏰ #2: 每日 8am HKT（US overnight session）**

**角色：** Opportunity finder — 由新聞入面搵投資機會

**Data source:** rss-feed (56 feeds, ~500-900 articles)

**Steps:**
1. RSS fetch
2. Curate (ACTION / WATCH / NOTE)
3. **每條 headline 入 DB** → `news_summary`（source='news-curator'）
4. Update `daily-ops.json` + git push
5. Discord output（Chinese Traditional）

**Core value:**
- Summarize 係基本盤
- 搵 investment opportunities 先係核心
- 每條有日期 + tickers（有就 fill，冇就 []）

---

### 3. Evening Review（美股收市回顧）
**⏰ 每日 8am HKT（US 收市後）**

**角色：** Post-mortem — 今日發生咗咩事

**Data source:** yahoo-finance, finnhub, fred

**Core value:**
- 今日大市表現
- 持倉 P&L
- Sector rotation
- 風險 checklist

**Output:** Discord + `daily-ops.json` → git push → Vercel

---

### 4. Weekly Screen（每週篩選）← UPDATED
**⏰ 逢星期六 6am HKT**

**角色：** Signal filter — 呢個星期邊啲 tickers 值得再睇？

**Input:** `news_summary`（7日 data）+ News Curator picks

**Steps:**
1. Query News Curator picks（source='news-curator', 7日）
2. Anomaly detection — tickers 突然出現
3. Thematic clustering — recurring themes
4. AI judgment → 邊 3-8 隻 tickers 值得再睇 + 點解

**Output：**
```
📊 每週篩選 — X月X日

🎯 高信心（News Curator 多次提及）
  NVDA — Computex + Anthropic IPO catalyst cluster
  MRVL — record high + AI infra theme

👀 值得睇（anomaly / 新出現）
  LTRX — 收購傳聞
  {細價股} — breakthrough news

📌 主題
  AI Semi — NVDA, MRVL, AVGO, ANET
  Crypto risk — TSLA, COIN, MARA
```

**唔做：** ❌ scoring、❌ price data、❌ sentiment trend、❌ trade recommendation

**Output:** Discord + `daily-ops.json` → git push → Vercel

---

### 5. Deep Dive（詳細分析）← NEW
**⏰ On-demand（你睇完 Weekly Screen 後話 run 先 run）**

**角色：** 逐隻 ticker 做 detailed analysis

**Steps:**
1. 你揀 tickers（from Weekly Screen output）
2. For each ticker:
   - Fundamentals（yahoo-finance: PE, EPS, revenue, margins）
   - Technicals（price chart, support/resistance）
   - News cluster（news_summary 相關 news）
   - Catalyst timeline（earnings, events, product launches）
   - Risk/reward assessment
3. **Output:** full analysis report

**Output:** Discord（你睇完決定 action）

---

## DB Schema

### `news_summary`（核心 table）
| Column | Type | Description |
|--------|------|-------------|
| id | integer PK | Auto |
| title | text | Headline |
| source | varchar | 'rss:bloomberg' / 'news-curator' |
| published_at | timestamp | News date |
| tickers | text[] | Mentioned tickers |
| sentiment_score | numeric | -1 to +1 |
| url | text | Source link |
| created_at | timestamp | Insert time |

---

## Cron Jobs Summary

| Name | Schedule | Skills | Output |
|------|----------|--------|--------|
| Morning Scan | Mon-Fri 8pm HKT | yahoo-finance, finnhub, fred, marketaux | Discord + daily-ops.json |
| News Curator #1 | Mon-Fri 8pm HKT | rss-feed | DB + daily-ops.json + Discord |
| Evening Review | Mon-Fri 8am HKT | yahoo-finance, finnhub, fred | Discord + daily-ops.json |
| News Curator #2 | Mon-Fri 8am HKT | rss-feed | DB + daily-ops.json + Discord |
| **Weekly Screen** | **Sat 6am HKT** | **（由 prompt 行 Python DB query + AI judgment）** | **Discord + daily-ops.json** |
| **Deep Dive** | **On-demand** | **yahoo-finance, finnhub** | **Discord** |

---

## Roadmap

### Phase 1 ✅
- Pipeline architecture 建立
- Morning Scan / News Curator / Evening Review running
- DB storage + Daily-ops dashboard

### Phase 2 🔄（Now）
- News Curator → DB insert fixed ✅
- Pipeline plan updated ✅
- Weekly Screen → Sat only（rewrite cron）
- Deep Dive pipeline（create）

### Phase 3 ⏳
- Paper Trade Agent（睇所有 output → 買賣建議）
- News Curator → 獨立 Profile（DeepSeek V4 Pro）
