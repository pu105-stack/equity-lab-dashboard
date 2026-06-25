#!/docker-data/hermes-venv/bin/python3
"""Test Nasdaq earnings calendar API for the next 30 days"""
import urllib.request
import json
import ssl
from datetime import datetime, timedelta, timezone

ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json',
    'Referer': 'https://www.nasdaq.com/',
}

today = datetime.now(timezone.utc)
results = []

# Fetch next ~30 days (skip weekends)
for i in range(35):
    d = today + timedelta(days=i)
    if d.weekday() >= 5:  # skip Sat/Sun
        continue
    date_str = d.strftime('%Y-%m-%d')
    url = f'https://api.nasdaq.com/api/calendar/earnings?date={date_str}'
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=15, context=ssl_ctx) as resp:
            data = json.loads(resp.read().decode())
            rows = data.get('data', {}).get('rows', [])
            for r in rows:
                mcap_str = r.get('marketCap', '0')
                try:
                    mcap = float(mcap_str.replace('$','').replace(',',''))
                except:
                    mcap = 0
                results.append({
                    'date': date_str,
                    'symbol': r['symbol'],
                    'name': r['name'],
                    'mcap': mcap,
                    'eps_forecast': r.get('epsForecast', ''),
                    'time': r.get('time', ''),
                    'fiscal_q': r.get('fiscalQuarterEnding', '')
                })
        print(f'{date_str}: {len(rows)} earnings')
    except Exception as e:
        print(f'{date_str}: error — {str(e)[:50]}')

# Filter notable: market cap > $10B
notable = [r for r in results if r['mcap'] >= 10_000_000_000]
notable.sort(key=lambda x: x['date'])

print(f'\n=== Notable (Market Cap > $10B): {len(notable)} events ===')
print(f'Total earnings events: {len(results)}')
print()

# Group by week
current_week = ''
for r in notable:
    week_label = f"Week of {r['date']}"[:12]
    if week_label != current_week:
        current_week = week_label
        print(f'\n--- {r["date"]} ---')
    mcap_b = f'${r["mcap"]/1e9:.1f}B'
    time_label = 'BMO' if 'pre' in r['time'] else 'AMC' if 'after' in r['time'] else ''
    print(f'  {r["symbol"]:6s} {r["name"][:40]:40s} {mcap_b:>8s}  EPS: {r["eps_forecast"]:>6s}  {time_label}')

# Also show which days are most active
from collections import Counter
day_counts = Counter(r['date'] for r in results)
print('\n=== Most active days ===')
for date, count in sorted(day_counts.items()):
    notable_count = sum(1 for r in notable if r['date'] == date)
    print(f'  {date}: {count} earnings ({notable_count} >$10B)')
