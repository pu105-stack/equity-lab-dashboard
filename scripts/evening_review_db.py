import json, sys
from datetime import datetime, timezone, timedelta

HKT = timezone(timedelta(hours=8))
now = datetime.now(HKT)

# Read the analysis from daily-ops.json
filepath = '/docker-data/equity-lab-dashboard/data/daily-ops.json'
with open(filepath) as f:
    data = json.load(f)

# Find today's evening review entry
entry = None
for r in data.get('runs', []):
    if r.get('pipeline') == '美股收市回顧' and r.get('date') == now.strftime('%Y-%m-%d'):
        entry = r
        break

if not entry:
    print("❌ No evening review entry found for today")
    sys.exit(1)

full_analysis = entry.get('analysis', '')

# Generate embedding
try:
    from fastembed import TextEmbedding
    embed_model = TextEmbedding('BAAI/bge-small-en-v1.5')
    embedding = list(embed_model.embed([full_analysis]))[0].tolist()
    print(f"✅ Generated embedding (dim={len(embedding)})")
except Exception as e:
    print(f"❌ Embedding failed: {e}")
    sys.exit(1)

# Write to DB
try:
    import psycopg2
    conn = psycopg2.connect(
        host='host.docker.internal',
        user='tradus371',
        password='QuantLab2026!',
        dbname='equity-db'
    )
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO pipeline_reports (pipeline, date, content, embedding, created_at)
        VALUES ('evening-review', %s, %s, %s::vector, NOW())
    """, (now.strftime('%Y-%m-%d'), full_analysis, embedding))

    conn.commit()
    cur.close()
    conn.close()
    print("✅ Wrote to pipeline_reports with embedding")
except Exception as e:
    print(f"❌ DB write failed: {e}")
    sys.exit(1)
