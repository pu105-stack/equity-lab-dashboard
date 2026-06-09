import json, os
from datetime import datetime, timezone, timedelta

HKT = timezone(timedelta(hours=8))
now = datetime.now(HKT)

market_direction = "🟡 Weak bounce — SPY +0.23% but faded from intraday high of $745, closed near lows at $739.22. Semis relief rally (+5%) but AAPL sell-the-news (-1.89%) capped tech gains."

headlines = [
    "📊 SPY +0.23% to $739.22 — gap-up opened at $743, faded all day to close near session lows. Bearish intraday tape.",
    "🖥️ SMH +5.00% — relief bounce from Friday -9.22% crash. INTC +11.19%, MU +9.87%, MRVL +9.63% (S&P 500 addition).",
    "🍎 AAPL -1.89% to $301.54 — WWDC sell-the-news. Siri AI + Google/Nvidia partnership underwhelmed. Volume spike 77.8M.",
    "🚗 TSLA +4.59% — SpaceX IPO halo effect + broader semi bounce carry.",
    "📈 MRVL +9.63% — S&P 500 addition effective today. AI networking story confirmed.",
    "📉 MSFT -1.18%, GOOGL -1.42%, META -1.28% — mega-cap tech dragged by AAPL weakness.",
    "🏦 XLF -0.63% — rotation trade took a breather after last week +1.69%. JPM -0.40%.",
    "🔗 10Y Yield 4.552% (+1.6bp) — yields grinding higher. Rate hike odds >50%. CPI (Tues) is key.",
    "😨 VIX 18.92 (from 21.51 Friday) — fear receded but still elevated (>18). Market not out of woods.",
    "⛽ Oil $91.07 (+0.6%) — Iran-Israel ceasefire holds but Hormuz Strait remains closed.",
]

opportunities = [
    "MRVL: S&P 500 addition catalyst +9.63%. AI networking play — structural beneficiary of AI buildout. Worth holding.",
    "INTC: +11.19% — turnaround story gaining traction. Semi rebound leader. Watch for CPI catalyst.",
    "MU: +9.87% — memory recovery trade. Earnings visibility improving. Semi pick-and-shovel play.",
    "SMH: +5% bounce from -9.22% crash. If CPI cooperates (core MoM ≤0.3%), semi rally has room to run.",
    "TSLA: SpaceX IPO halo effect. If SpaceX prices $1.75T valuation this week, further upside possible.",
    "LLY: +1.57% — next-gen weight loss drug phase 3 positive data. GLP-1 TAM still enormous.",
]

risks = [
    "⚠️ CPI (Tue Jun 9) — MARKET MAKER. Core MoM consensus +0.3%. Beat = rate hike odds surge → growth/semi selloff. Miss = risk-on rally.",
    "⚠️ FOMC (Wed Jun 10) — Dot plot update. Any rate hike signal or hawkish shift = negative for equities.",
    "⚠️ AAPL WWDC disappointment — -1.89% on elevated volume suggests institutional distribution. Could drag semis/tech lower Tuesday.",
    "⚠️ 10Y yield 4.552% and rising — if yields break 4.60%, growth stocks face mechanical selling pressure.",
    "⚠️ BofA Take Profits warning — official Wall Street sell signal. Bear market signposts multiplying.",
    "⚠️ ORCL earnings (tonight) — AI infrastructure bellwether. Miss = negative readthrough for SMCI/DELL.",
    "⚠️ Iran-Israel ceasefire fragile — Israel's Netanyahu position unclear. Hormuz Strait remains closed. Oil spike risk.",
    "⚠️ Pentagon re-blacklists BABA/BIDU/BYD — China tech geopolitical risk escalating.",
]

my_take = (
    'Overall Bias: 🟡 Neutral-Bearish heading into CPI\n\n'
    "Today's bounce was weak — SPY opened at $743, rallied to $745, then faded to close at $739.22. That's a failed rally pattern. "
    "The semis relief bounce (+5% SMH) was mechanical oversold bounce, not conviction buying. The real story today was AAPL -1.89% on WWDC — "
    "the market voted \"not impressed\" with the Siri AI announcement. If AAPL can't hold post-WWDC, the AI narrative trade is vulnerable.\n\n"
    "Tomorrow is ALL about CPI. Core MoM +0.3% is the line in the sand:\n"
    "- ≤+0.2% → risk-on rally, semis bounce continues, yields fall\n"
    "- +0.3% → mixed, status quo\n"
    "- ≥+0.4% → growth/semis selloff resumes, XLF/energy/XLV relative outperformance\n\n"
    "My bet: CPI prints core +0.3% (inline). Market initially wobbles then stabilizes. "
    "FOMC Wednesday is the real event. The dot plot matters more than CPI.\n\n"
    "Tonight watch: ORCL earnings (AI infrastructure readthrough), Asia session reaction to AAPL WWDC disappointment."
)

full_analysis = """# 📊 Evening Review — 6月8日（星期一）

## 📊 Market Recap

### 指數表現（6月8日收市）
| 指數 | 收市價 | 日變幅 | 上週五變幅 |
|---|---|---|---|
| **SPY** | $739.22 | **+0.23%** | -2.58% |
| **QQQ** | $716.07 | **+1.56%** | -4.80% |
| **DIA** | $508.91 | **-0.16%** | -1.35% |
| **IWM** | $284.11 | **+0.87%** | -2.68% |
| **VIX** | 18.92 | -2.59pts | +39.7% ($21.51) |

### 盤中走勢分析
SPY 今日高開喺 ~$743（gap up from Friday $737.55），早段反彈至日內高位 ~$745，**然後全日單邊回落**，最後一粒鐘加速跌至 $738.19 低位，收 $739.22。**呢個係典型嘅 failed rally pattern** — 開高走低，buyers 唔肯接貨。

QQQ 表現稍好（+1.56%），純粹因為 semis 板塊機械式反彈。但扣除 semis 嘅貢獻，QQQ 其實係 flat to negative — AAPL -1.89%、MSFT -1.18%、GOOGL -1.42%、META -1.28%。

### Sector Performance

| 板塊 | ETF | 日變幅 | 備註 |
|---|---|---|---|
| 🟢 半導體 | SMH | **+5.00%** | 上週五-9.22%後反彈，但仍遠低於6/2高位$632 |
| 🟢 科技 | XLK | **+2.15%** | Semis拉動，但megacap tech受AAPL拖累 |
| 🟢 能源 | XLE | **+1.14%** | 油價$91穩定，伊朗停火未完全解除風險溢價 |
| 🟢 小型股 | IWM | **+0.87%** | 跟隨大市反彈，幅度有限 |
| 🟢 非必需消費 | XLY | **+0.46%** | TSLA +4.59%主導 |
| 🔴 金融 | XLF | **-0.63%** | 上週+1.69%後回調，rotation trade暫停 |
| 🔴 公用 | XLU | **-1.87%** | 利率上升壓力 |
| 🔴 原材料 | XLB | **-1.32%** | 避險情緒仍偏強 |
| 🔴 地產 | XLRE | **-1.50%** | 利率敏感 |

### Volume / Breadth
- SPY 成交量 **49.2M** — 低於上週五嘅93.7M（恐慌拋售），但高於正常嘅31-40M。市場未平靜。
- SPY 全日由高位回落 ~$6（$745→$739）— 買盤跟進意願唔強。
- SMH 成交量13.8M （vs 22M Friday）— 反彈成交縮減，唔係 conviction buying。

### VIX
- 收 18.92（上週五 21.51）— 恐慌情緒降溫，但 **VIX > 18 仍代表市場處於警戒水平**。

---

## 🔥 Notable Movers

### 今日最大贏家（>3%）

| 股票 | 變幅 | Catalyst |
|---|---|---|
| **INTC** | **+11.19%** | 半導體 turnaround 故事持續升溫。上週-6.27%後強力反彈。Citi SPX 8100 target 利好半導體。 |
| **MU** | **+9.87%** | Memory 週期回暖。長約改善盈利可見性。上週五被錯殺後反彈。 |
| **MRVL** | **+9.63%** | **S&P 500 今日生效加入**。盤前已+9%。AI networking 龍頭。84M股成交，極高關注。 |
| **SMCI** | **+5.64%** | AI server 需求結構性增長。上週五被大市拖累後反彈。 |
| **AMD** | **+5.14%** | GPU 競爭格局持續。上週五-9.8%後反彈。 |
| **TSLA** | **+4.59%** | SpaceX IPO 光環效應（週五定價$1.75T）。Musk wealth effect play。50M股成交。 |
| **AVGO** | **+2.82%** | 上週-20.5%兩日後溫和反彈。AI custom chip 故事未完但修復需時。 |
| **NVDA** | **+1.73%** | 溫和反彈。PE 31.5/forward PE 16.2 — 估值已合理但市場情緒仍偏弱。 |

### 今日最大輸家

| 股票 | 變幅 | Catalyst |
|---|---|---|
| **AAPL** | **-1.89%** | **WWDC sell-the-news**。Siri AI + Google/Nvidia partnership 令市場失望。「Privacy-first」approach 被視為競爭劣勢。成交量77.8M（vs 正常45-65M）— 機構派貨信號。 |
| **GOOGL** | **-1.42%** | AAPL 拖累 megacap tech。無自家 catalyst。 |
| **META** | **-1.28%** | 同上。社交媒體板塊無催化劑。 |
| **MSFT** | **-1.18%** | 相對於其他 megacap 算抗跌。AI 故事相對穩固。 |
| **ORCL** | **-0.87%** | 收市後業績。市場審慎。 |

### Sector Rotation Signals
- 上週嘅 XLF→QQQ rotation 今日暫停 — XLF -0.63%，資金未進一步流入防守性板塊。
- 但今日嘅 semi 反彈純粹係 oversold bounce，唔係結構性rotation reversal。
- **關鍵問題**：如果AAPL繼續弱，QQQ會唔會再次領跌？定係semi反彈可以抵消？

---

## 📰 News That Mattered

### ✅ WWDC 2026 — AAPL Siri AI
- Tim Cook 最後一次以CEO身份主講WWDC
- 公佈 Siri AI Agent 平台 + Google/Nvidia 合作
- **市場反應：失望。** AAPL -1.89%，$301.54收市
- 合作Google/Nvidia 被解讀為Apple AI能力不足，要靠外部
- Privacy-first messaging 可能太保守，唔夠對手進取
- **News Curator 嘅 call: 中！** 晨早scan話「若市場已完全price in → sell the news風險」— exactly 發生咗

### ✅ MRVL 加入 S&P 500
- 今日生效。盤前+9%，全日收+9.63%
- AI networking 嘅 pure play — Corning 同三大hyperscaler簽約嘅受惠者
- **News Curator 嘅 call: 中！** ACTION item 有GLW（Corning），MRVL作為S&P加入嘅直接受惠者

### ⚠️ BofA 'Take Profits' Warning
- BofA 出正式sell signal — bear market signposts multiplying
- Breadth deterioration, rate hike risk, stretched AI valuations
- 對市場情緒有壓制作用 — 解釋咗點解今日反彈咁弱

### ⚠️ Pentagon 重新將BABA/BIDU/BYD列入軍事黑名單
- 2月突然移除後今日恢復
- 中概股風險升溫，影響HSI同China tech ADR

### 🔜 ORCL Earnings（收市後）
- AI infrastructure 最重要嘅 earnings 之一
- 直接影響 SMCI/DELL 嘅 AI server 需求 narrative

---

## 🎯 Opportunities Carry Forward

### 1️⃣ MRVL — S&P 500 催化劑已兌現，但故事未完
- +9.63% 今日係 index inclusion 嘅一次性效應
- 但 AI networking 嘅 structural demand（GLW 不斷簽約 hyperscaler）支持中期睇法
- **明天策略：** 如果 CPI 溫和，MRVL pullback 係買入機會

### 2️⃣ INTC/MU — Semi turnaround trade
- INTC +11.19%/MU +9.87% 今日領漲 semis
- 如果 CPI 唔爆（core MoM ≤+0.3%），呢個 trade 可以繼續
- **Setup for tomorrow:** CPI 前可以小注，CPI後confirm加倉

### 3️⃣ SMH — Oversold bounce 定 reversal？
- 今日+5%但成交縮減 — 未確認 reversal
- **關鍵水平：** SMH 需收復 $620（pre-Friday level）先算 reversal
- CPI + FOMC 決定方向

### 4️⃣ TSLA — SpaceX IPO halo
- SpaceX 週五定價 $1.75T，史上最大IPO
- TSLA +4.59% 今日反映 Musk wealth effect
- 如果首日大升，TSLA 有額外上行空間

### 5️⃣ LLY — 減肥藥王者未變
- Phase 3 positive data for next-gen GLP-1
- AZN加入競爭但validate個market
- LLY +1.57% 今日 — 穩步向上，避險+增長雙重屬性

---

## ⚠️ Risks / Watchlist

### 🔴 HIGH — CPI（星期二 6月9日）
- **呢個係本週最重要嘅 catalyst**
- 市場共識：核心CPI MoM +0.3%
- **如果 >+0.4%** → Fed加息預期急升 → growth/semi大規模selloff，SPY測試$730
- **如果 <+0.2%** → risk-on rally，semis持續反彈，SPY re-test $750

### 🔴 HIGH — FOMC（星期三 6月10日）
- 利率決議（預期按兵不動）+ 點陣圖更新
- **點陣圖係關鍵** — 如果2026年加息預期中位數出現，市場會大幅波動
- 市場已pricing in ~50%加息概率

### 🔴 HIGH — AAPL WWDC Aftermath
- -1.89% 係明確嘅sell signal。$300 整數關口係下一個support
- 如果AAPL跌破$300，對NASDAQ/QQQ係重大負面信號
- **半導體反彈可能被AAPL弱勢抵消**

### 🟡 MEDIUM — 10Y Yield 突破4.55%
- 10Y 4.552% — 如果突破4.60%，growth stocks機械式selloff
- 30Y 已突破5%（5.024%）— 長端利率上升限制估值擴張

### 🟡 MEDIUM — ORCL Earnings（今晚）
- AI infrastructure 風向標
- 如果ORCL miss / 保守指引 → SMCI/DELL/整個AI基建板塊受壓
- 如果beat + raise → AI capex cycle confirmed

### 🟡 MEDIUM — 伊朗-以色列停火
- 協議脆弱。以色列內塔尼亞胡態度未明
- Hormuz海峽仍關閉 — 油價$91仍包含風險溢價

### 🟡 MEDIUM — Pentagon 黑名單（BABA/BIDU/BYD）
- 中概股風險升溫
- 如果擴大至更多中國科技公司，ADR市場受壓

### 🟢 LOW — Bitcoin
- $62,552 — 企穩$62k但未脫險
- 仍處於去槓桿/清算風險中

---

## 💡 My Take

**Today's Summary:** Weak bounce, failed rally, AAPL disappointment.

今日嘅價格行動講嘅故事好清楚：**市場想反彈，但冇力氣**。SPY 高開 $743、早段衝 $745，然後全日陰跌收 $739.22 — 呢個係典型嘅 dead cat bounce pattern，唔係 genuine reversal。

最重要嘅信號係 **AAPL -1.89% on WWDC day**。呢個係 "buy the rumor, sell the news" 嘅教科書案例。Tim Cook 最後一次WWDC、Siri AI Agent 平台、Google/Nvidia 合作 — 全部都已經被預期同price in。結果係市場話「唔夠好」。如果連AAPL都唔可以靠AI故事撐住，咁成個AI narrative trade 係脆弱嘅。

好消息係 **semis 今日強力反彈**（SMH +5%，INTC +11%，MU +10%）。呢個係 oversold bounce，但至少證明咗 semis 嘅基本需求未消失 — MRVL 嘅 S&P 500 inclusion 同 Corning deal 都係實質催化劑。

**Tomorrow is ALL about CPI.** 我嘅 base case：核心CPI MoM +0.3%（inline）。市場 short-term 反應會係 mixed，然後焦點轉向星期三 FOMC。關鍵係點陣圖 — 如果2026年加息預期被移除，就係 dovish surprise。

**最大嘅交易機會：** 如果CPI出嚟溫和 (+0.2-0.3%) + 如果 AAPL 唔再跌穿 $300 — 呢個係 buy semis (SMH/INTC/MU) 嘅好機會。但如果CPI >0.4%，乜都唔好買。

**Overall Bias: 🟡 Neutral-Bearish 短期，Bullish 中期**
- 短期（本週）：CPI/FOMC 雙重不確定性，低吸高拋
- 中期（6月）：AI supercycle 未變，回調係買入機會
- 關鍵水平：SPY $730（support），$750（resistance）
"""

# ========================
# Write to daily-ops.json
# ========================
filepath = '/docker-data/equity-lab-dashboard/data/daily-ops.json'

try:
    with open(filepath) as f: data = json.load(f)
except:
    data = {'runs': []}

entry = {
    'pipeline': '美股收市回顧',
    'date': now.strftime('%Y-%m-%d'),
    'time': now.strftime('%H:%M HKT'),
    'status': 'success',
    'market_direction': market_direction,
    'headlines': headlines,
    'opportunities': opportunities,
    'analysis': full_analysis,
    'risks': risks,
    'my_take': my_take,
}

data['runs'] = [r for r in data['runs']
    if not (r.get('pipeline') == entry['pipeline'] and r.get('date') == entry['date'])]
data['runs'].append(entry)

with open(filepath, 'w') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print('✅ Wrote to daily-ops.json')
print(f'Date: {now.strftime("%Y-%m-%d %H:%M HKT")}')
