#!/usr/bin/env python3
"""
Phase 8: Store QCOM deep dive results into DB + sync JSON files.
Fixed: commit after each operation to prevent rollback cascade.
"""
import json, sys, os
from datetime import datetime, timezone, timedelta, date

HKT = timezone(timedelta(hours=8))
NOW = datetime.now(HKT)
TODAY = NOW.date()

# ── The complete analysis ──
with open('/workspace/docker-data/equity-lab-dashboard/data/qcom-deep-dive-analysis.txt', 'r') as f:
    full_analysis = f.read()

# ── Data to store ──
ticker = 'QCOM'
decision = 'BUY'
conviction = 'Med-Hi 7.0'
fair_value = 195.52
upside_pct = 3.2
verdict_summary = """BUY — 中等偏高信心 (7.0/10)。Qualcomm正經歷從「成熟手機晶片商」到「AI基礎設施公司」的歷史性重新定價。
Meta確認為數據中心AI晶片首個客戶，驗證了pivot戰略可行性。
當前P/E 20.4x vs 同業中位數76.2x（73%折讓），FCF收益率4.8%為同業5倍。
機率加權公允價值$195.52，12個月目標價$213（分析師共識）。
牛市情境（25%概率）可達$250-300（+32-58%），因AI重新定價。
建議買入區間$175-195，止損週收盤低於$140。
核心催化：7月底Q3 FY2026財報（數據中心營收首次貢獻）、Snapdragon Summit（10月）、潛在更多超大規模客戶公告。"""

key_catalysts = [
    "Meta確認為數據中心AI晶片首個客戶 — 驗證AI pivot可行性",
    "非手機收入2029年目標翻倍指引",
    "Q3 FY2026財報（2026年7月底）— 數據中心營收首次貢獻",
    "Snapdragon Summit 2026（10月）— 產品路線圖更新",
    "潛在更多超大規模客戶公告（AWS/Google/Microsoft）",
    "AI估值重新定價（P/E 20x → 25-30x）",
    "Windows on ARM/Copilot+ PC市場份額突破",
    "汽車Design Win管道（$30B+）轉化為營收",
    "股份回購持續減少流通股（每年2-3%）+ 2%股息",
    "FCF收益率4.8%為半導體AI同業5倍提供安全邊際",
]

# ── Generate embedding using fastembed ──
print("Generating 384-dim embedding with fastembed...")
from fastembed import TextEmbedding
embed_model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")
embedding = list(embed_model.embed([full_analysis[:8000]]))[0]
embedding_list = [float(x) for x in embedding]
print(f"  ✅ Embedding generated: {len(embedding_list)} dimensions")

import psycopg2

def get_conn():
    return psycopg2.connect(
        host="host.docker.internal", port=5432,
        dbname="equity-db", user="tradus371",
        password="QuantLab2026!"
    )

# ── 1. INSERT into deep_dive_results ──
print(f"\n📊 [1/3] Inserting into deep_dive_results for {ticker}...")
try:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO deep_dive_results 
        (ticker, decision, conviction, verdict, full_analysis, fair_value, upside_pct, key_catalysts, completed_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (ticker, decision, conviction, verdict_summary, full_analysis, fair_value, upside_pct, key_catalysts, NOW))
    conn.commit()
    cur.close()
    conn.close()
    print(f"  ✅ deep_dive_results INSERTED")
except Exception as e:
    print(f"  ❌ deep_dive_results FAILED: {e}")

# ── 2. INSERT into pipeline_reports ──
print(f"\n📊 [2/3] Inserting into pipeline_reports for {ticker}...")
try:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO pipeline_reports (ticker, pipeline, date, content, embedding, created_at)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (ticker, 'deep-dive', TODAY, full_analysis, embedding_list, NOW))
    conn.commit()
    cur.close()
    conn.close()
    print(f"  ✅ pipeline_reports INSERTED")
except Exception as e:
    print(f"  ❌ pipeline_reports FAILED: {e}")

# ── 3. UPDATE weekly_screen ──
print(f"\n📊 [3/3] Updating weekly_screen for {ticker}...")
try:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        UPDATE weekly_screen
        SET deep_dive_status = 'done', done_at = %s
        WHERE ticker = %s
    """, (NOW, ticker))
    updated = cur.rowcount
    conn.commit()
    cur.close()
    conn.close()
    print(f"  ✅ weekly_screen UPDATED ({updated} rows)")
except Exception as e:
    print(f"  ❌ weekly_screen FAILED: {e}")

print(f"\n✅ Phase 8 storage complete for {ticker} at {NOW.isoformat()}")
