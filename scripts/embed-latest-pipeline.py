#!/usr/bin/env python3
"""
Auto-detect latest pipeline run from daily-ops.json that isn't yet in pipeline_reports,
generate embedding, and insert into DB.
Designed to be called by any cron job at the end of its run.
"""
import json, sys
import psycopg2
from fastembed import TextEmbedding

def main():
    # Read daily-ops.json
    with open('/docker-data/equity-lab-dashboard/public/data/daily-ops.json') as f:
        data = json.load(f)
    
    # Get latest run
    if not data['runs']:
        print("No runs found")
        return
    
    latest = data['runs'][0]
    pipeline = latest['pipeline']
    date = latest['date']
    
    # Build content
    if pipeline == '每週篩選':
        headlines = '\n'.join(latest.get('headlines', []))
        content = f"每週篩選 {date}\n\n市場方向: {latest.get('market_direction','')}\n\n{headlines}\n\n分析: {latest.get('my_take','')}"
    elif '開市' in pipeline:
        content = f"{pipeline} {date}\n\nSPY: {latest.get('spy','')} VIX: {latest.get('vix','')}\n\n市場方向: {latest.get('market_direction','')}\n\n{latest.get('analysis','')}\n\n分析: {latest.get('my_take','')}"
    elif '收市' in pipeline:
        content = f"{pipeline} {date}\n\nSPY: {latest.get('spy','')} VIX: {latest.get('vix','')}\n\n{latest.get('analysis','')}\n\n分析: {latest.get('my_take','')}"
    elif '新聞' in pipeline:
        headlines = '\n'.join(latest.get('headlines', []))
        content = f"{pipeline} {date}\n\n市場方向: {latest.get('market_direction','')}\n\n頭條:\n{headlines}\n\n詳細分析:\n{latest.get('analysis','')}\n\n分析師看法: {latest.get('my_take','')}"
    else:
        content = f"{pipeline} {date}\n\n{latest.get('market_direction','')}\n\n{latest.get('my_take','')}"
    
    if not content.strip():
        print("Empty content, skipping")
        return
    
    # Check if already in pipeline_reports
    conn = psycopg2.connect(
        host='host.docker.internal', port=5432,
        user='tradus371', password='QuantLab2026!',
        dbname='equity-db'
    )
    cur = conn.cursor()
    cur.execute("SELECT id FROM pipeline_reports WHERE pipeline=%s AND date=%s ORDER BY created_at DESC LIMIT 1",
                (pipeline, date))
    existing = cur.fetchone()
    if existing:
        print(f"⏭️ Already embedded: {pipeline} {date} (id={existing[0]})")
        cur.close()
        conn.close()
        return
    
    # Generate and insert
    model = TextEmbedding('BAAI/bge-small-en-v1.5')
    embedding = list(model.embed([content]))[0].tolist()
    
    cur.execute('''
        INSERT INTO pipeline_reports (pipeline, date, content, embedding, created_at)
        VALUES (%s, %s, %s, %s::vector, NOW())
    ''', (pipeline, date, content, embedding))
    conn.commit()
    
    # Get the new ID
    cur.execute("SELECT id FROM pipeline_reports WHERE pipeline=%s AND date=%s ORDER BY created_at DESC LIMIT 1",
                (pipeline, date))
    new_id = cur.fetchone()[0]
    
    cur.close()
    conn.close()
    print(f'✅ Embedded: {pipeline} {date} (id={new_id}, {len(embedding)} dim)')

if __name__ == '__main__':
    main()
