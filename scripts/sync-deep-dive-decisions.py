#!/usr/bin/env python3
"""
Sync decisions from Vercel API + DB into data/deep-dive-decisions.json.
Called by Maya (deep-dive-polling) before processing.

Logic:
- GET https://oscary.space/api/deep-dive → decisions list (user's status choices)
- Query weekly_screen DB → get reasoning, category for each ticker
- MERGE: overlay Vercel status + DB reasoning onto existing entries
- REMOVE: entries with status='skip' or status='done'
- WRITE: clean file with only pending + deep_dive entries
- git add (no push — wait for next pipeline push)
"""

import json, subprocess, sys, os, urllib.request
from datetime import datetime

VERCEL_API = "https://oscary.space/api/deep-dive"
FILE_PATH = "/docker-data/equity-lab-dashboard/data/deep-dive-decisions.json"

# DB query — runs in Docker where host.docker.internal works
DB_QUERY = """
SELECT ticker, category, reasoning, catalyst, theme, screen_date, deep_dive_status
FROM weekly_screen
ORDER BY screen_date DESC
"""


def fetch_db_reasons():
    """Query weekly_screen from DB for reasoning data."""
    import psycopg2
    try:
        conn = psycopg2.connect(
            host="host.docker.internal", port=5432,
            dbname="equity-db", user="tradus371",
            password="QuantLab2026!"
        )
        cur = conn.cursor()
        cur.execute(DB_QUERY)
        reasons = {}
        for row in cur.fetchall():
            ticker, category, reasoning, catalyst, theme, screen_date, deep_dive_status = row
            reasons[ticker] = {
                "reasoning": reasoning or "",
                "source": category or "headlines",
                "catalyst": catalyst or "",
                "theme": theme or "",
                "screen_date": str(screen_date) if screen_date else "",
                "deep_dive_status": deep_dive_status or "pending",
            }

        # Also fetch already-analyzed tickers from deep_dive_results
        cur.execute("SELECT DISTINCT ticker FROM deep_dive_results")
        done_tickers = {row[0] for row in cur.fetchall()}
        for t in done_tickers:
            if t in reasons:
                reasons[t]["deep_dive_status"] = "done"
            else:
                reasons[t] = {
                    "reasoning": "",
                    "source": "",
                    "catalyst": "",
                    "theme": "",
                    "screen_date": "",
                    "deep_dive_status": "done",
                }

        cur.close()
        conn.close()
        return reasons
    except Exception as e:
        print(f"⚠️ DB query failed: {e}")
        return {}


def main():
    # 1. Fetch from Vercel (user decisions)
    try:
        resp = urllib.request.urlopen(VERCEL_API, timeout=15)
        vercel_data = json.loads(resp.read())
    except Exception as e:
        print(f"⚠️ Cannot fetch Vercel API: {e}")
        return

    vercel_decisions = vercel_data.get("decisions", [])
    # 就算 Vercel 冇 data，都照由 DB bootstrap
    print(f"ℹ️ Vercel: {len(vercel_decisions)} decisions")

    # 2. Fetch reasoning from DB
    db_reasons = fetch_db_reasons()
    if db_reasons:
        print(f"✅ DB: {len(db_reasons)} tickers with reasoning")
    else:
        print("⚠️ No DB data — will use existing JSON data only")

    # 3. Read local file
    try:
        with open(FILE_PATH) as f:
            local_data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        local_data = {"decisions": []}

    # 4. Build merged map
    vercel_map = {d["ticker"]: d for d in vercel_decisions}
    local_map = {d["ticker"]: d for d in local_data.get("decisions", [])}

    merged = {}

    # Start with DB tickers (always have reasoning)
    for ticker, db in db_reasons.items():
        merged[ticker] = {
            "ticker": ticker,
            "status": "done" if db.get("deep_dive_status") == "done" else "pending",
            "updated_at": db.get("screen_date", datetime.now().isoformat()),
            "reasoning": db.get("reasoning", ""),
            "source": db.get("source", "headlines"),
        }

    # Then overlay local entries (may have user set status from previous runs)
    for ticker, entry in local_map.items():
        if ticker not in merged:
            merged[ticker] = dict(entry)
        else:
            # Don't overwrite 'done' with local status
            if merged[ticker]["status"] != "done":
                merged[ticker]["status"] = entry.get("status", merged[ticker]["status"])
            if entry.get("reasoning") and not merged[ticker].get("reasoning"):
                merged[ticker]["reasoning"] = entry["reasoning"]

    # Then overlay Vercel (latest user decisions) — but don't overwrite 'done'
    for ticker, entry in vercel_map.items():
        if ticker not in merged:
            merged[ticker] = dict(entry)
        else:
            if merged[ticker]["status"] != "done":
                merged[ticker]["status"] = entry.get("status", merged[ticker]["status"])
            merged[ticker]["updated_at"] = entry.get("updated_at", merged[ticker].get("updated_at", ""))

    # 6. Remove skip + done
    active = [e for e in merged.values() if e.get("status") not in ("skip", "done")]

    # 7. Write back
    output = {"decisions": active, "last_synced": datetime.now().isoformat()}
    with open(FILE_PATH, "w") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    # Stats
    with_reasoning = sum(1 for d in active if d.get("reasoning"))
    print(f"✅ Sync complete: {len(vercel_decisions)} from Vercel + {len(db_reasons)} from DB → {len(active)} active candidates ({with_reasoning} with reasoning)")

    # 8. Git stage only — 唔 push，等下次 pipeline push 時一齊帶出去
    os.chdir("/docker-data/equity-lab-dashboard")
    subprocess.run(["git", "add", "data/deep-dive-decisions.json"], capture_output=True)
    r = subprocess.run(["git", "diff", "--cached", "--quiet"], capture_output=True)
    if r.returncode != 0:
        print(f"✅ Staged: data/deep-dive-decisions.json ({len(active)} active, {with_reasoning} with reasoning)")
    else:
        print("ℹ️ No changes to stage")


if __name__ == "__main__":
    main()
