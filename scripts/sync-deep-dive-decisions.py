#!/usr/bin/env python3
"""
Sync decisions from Vercel API into data/deep-dive-decisions.json.
Called by Maya (deep-dive-polling) before processing.

Logic:
- GET https://oscary.space/api/deep-dive → decisions list
- Read local data/deep-dive-decisions.json
- MERGE: overlay Vercel status onto existing entries
- REMOVE: entries with status='skip' or status='done'
- WRITE: clean file with only pending + deep_dive entries
- git add, commit, push
"""
import json, subprocess, sys, os

VERCEL_API = "https://oscary.space/api/deep-dive"
FILE_PATH = "/docker-data/equity-lab-dashboard/data/deep-dive-decisions.json"

def main():
    # 1. Fetch from Vercel
    import urllib.request
    try:
        resp = urllib.request.urlopen(VERCEL_API, timeout=15)
        vercel_data = json.loads(resp.read())
    except Exception as e:
        print(f"⚠️ Cannot fetch Vercel API: {e}")
        return

    vercel_decisions = vercel_data.get("decisions", [])
    if not vercel_decisions:
        print("ℹ️ No decisions from Vercel, nothing to sync")
        return

    # 2. Read local file
    try:
        with open(FILE_PATH) as f:
            local_data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        local_data = {"decisions": []}

    # 3. Build map: ticker → entry
    vercel_map = {d["ticker"]: d for d in vercel_decisions}
    local_map = {d["ticker"]: d for d in local_data.get("decisions", [])}

    # 4. Merge: Vercel status overlays local
    merged = {}
    for ticker, entry in local_map.items():
        merged[ticker] = dict(entry)  # copy
        if ticker in vercel_map:
            # Overlay status + timestamp from Vercel
            merged[ticker]["status"] = vercel_map[ticker]["status"]
            merged[ticker]["updated_at"] = vercel_map[ticker].get("updated_at", entry.get("updated_at",""))

    # Also add any new tickers from Vercel not in local
    for ticker, entry in vercel_map.items():
        if ticker not in merged:
            merged[ticker] = dict(entry)

    # 5. REMOVE skip + done entries
    active = [e for e in merged.values() if e.get("status") not in ("skip", "done")]

    # 6. Write back
    output = {"decisions": active, "last_synced": __import__('datetime').datetime.now().isoformat()}
    with open(FILE_PATH, "w") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"✅ Sync complete: {len(vercel_decisions)} from Vercel → {len(active)} active candidates")

    # 7. Git push
    os.chdir("/docker-data/equity-lab-dashboard")
    subprocess.run(["git", "add", "data/deep-dive-decisions.json"], capture_output=True)
    r = subprocess.run(["git", "diff", "--cached", "--quiet"], capture_output=True)
    if r.returncode != 0:
        subprocess.run(["git", "commit", "-m", f"sync: deep-dive decisions ({len(active)} active)"], capture_output=True)
        subprocess.run(["git", "push"], capture_output=True)
        print("✅ Git pushed")
    else:
        print("ℹ️ No changes to push")

if __name__ == "__main__":
    main()
