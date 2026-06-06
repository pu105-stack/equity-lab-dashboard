#!/usr/bin/env python3
"""
Usage: embed-pipeline-report.py "Pipeline Name" "2026-06-06" "content text"
or:    echo "content text" | embed-pipeline-report.py "Pipeline Name" "2026-06-06"

Generates embedding using fastembed and inserts into pipeline_reports.
"""
import sys, os
import psycopg2
from fastembed import TextEmbedding

def main():
    if len(sys.argv) < 3:
        print("Usage: embed-pipeline-report.py 'Pipeline Name' '2026-06-06' [content]")
        sys.exit(1)
    
    pipeline = sys.argv[1]
    date = sys.argv[2]
    
    # Content from arg or stdin
    if len(sys.argv) >= 4:
        content = sys.argv[3]
    else:
        content = sys.stdin.read()
    
    if not content.strip():
        print("⚠️ Empty content, skipping")
        return
    
    # Generate embedding
    model = TextEmbedding('BAAI/bge-small-en-v1.5')
    embedding = list(model.embed([content]))[0].tolist()
    
    # Insert to DB
    conn = psycopg2.connect(
        host='host.docker.internal', port=5432,
        user='tradus371', password='QuantLab2026!',
        dbname='equity-db'
    )
    cur = conn.cursor()
    cur.execute('''
        INSERT INTO pipeline_reports (pipeline, date, content, embedding, created_at)
        VALUES (%s, %s, %s, %s::vector, NOW())
    ''', (pipeline, date, content, embedding))
    conn.commit()
    cur.close()
    conn.close()
    print(f'✅ Embedded: {pipeline} {date} ({len(embedding)} dim)')

if __name__ == '__main__':
    main()
