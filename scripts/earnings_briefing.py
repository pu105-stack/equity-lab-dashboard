#!/usr/bin/env python3
"""Earnings Calendar Briefing — fetch next 30 days from Nasdaq API, filter notable events, deliver to Oscar."""
import urllib.request, json, ssl, pathlib
from datetime import datetime, timedelta, timezone
from collections import defaultdict, Counter

ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json',
    'Referer': 'https://www.nasdaq.com/',
}

WATCHLIST = {'AAPL','ACN','ADBE','AMZN','AVGO','BX','C','CVX','GLW','GOOGL',
             'INTC','LLY','META','MRVL','MSFT','MSTR','MU','NEE','NKE','NVDA',
             'ORCL','PINS','RKLB','SATS','WDC'}

today = datetime.now(timezone.utc)
results = []

for i in range(40):
    d = today + timedelta(days=i)
    if d.weekday() >= 5:
        continue
    date_str = d.strftime('%Y-%m-%d')
    url = f'https://api.nasdaq.com/api/calendar/earnings?date={date_str}'
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=15, context=ssl_ctx) as resp:
            rows = json.loads(resp.read().decode()).get('data', {}).get('rows', [])
            if rows is None:
                continue
            for r in rows:
                mcap_str = r.get('marketCap', '0')
                try:
                    mcap = float(mcap_str.replace('$','').replace(',',''))
                except:
                    mcap = 0
                results.append({
                    'date': date_str,
                    'symbol': r['symbol'].replace('.', ''),
                    'name': r['name'],
                    'mcap': mcap,
                    'eps': r.get('epsForecast', ''),
                    'time': r.get('time', '')
                })
    except:
        continue

today_label = today.strftime('%b %d, %Y')

# ── Filter notable: $50B+ tracked tickers (any cap), $50B-$3T for others ──
def is_notable(r):
    if r['symbol'] in WATCHLIST:
        return r['mcap'] >= 10_000_000_000  # tracked tickers only need $10B
    return 50_000_000_000 < r['mcap'] < 3_000_000_000_000

notable_events = [r for r in results if is_notable(r)]
notable_events.sort(key=lambda x: (x['date'], -(x['mcap'] if x['mcap'] < 3e12 else 0)))

lines = []
lines.append(f"📅 **Earnings Calendar** — {today_label}")

# ── Group by week and output tables ──
by_week = defaultdict(list)
for r in notable_events:
    d = datetime.strptime(r['date'], '%Y-%m-%d')
    week_start = d - timedelta(days=d.weekday())
    by_week[week_start].append(r)

for ws in sorted(by_week.keys()):
    week_label = ws.strftime('%b %d')
    events = by_week[ws]
    lines.append(f"\n  *{week_label} 週*")
    lines.append("```")
    lines.append(f"{'Date':>12} | {'Sym':6s} | {'Company':35s} | {'MCap':>7s} | {'EPS Est':>10s} | {'Time'}")
    lines.append(f"{'-'*12}-+-{'-'*6}-+-{'-'*35}-+-{'-'*7}-+-{'-'*10}-+-{'-'*6}")
    for r in events:
        d = datetime.strptime(r['date'], '%Y-%m-%d').strftime('%a %b %d')
        mcap_b = f"${r['mcap']/1e9:.0f}B"
        eps_str = f"${r['eps']}" if r['eps'] else ''
        tm = 'BMO' if 'pre' in r['time'] else 'AMC' if 'after' in r['time'] else ''
        name = r['name'][:35]
        flag = ' 🎯' if r['symbol'] in WATCHLIST else ''
        lines.append(f"{d:>12} | {r['symbol']:6s} | {name:35s} | {mcap_b:>7s} | {eps_str:>10s} | {tm}{flag}")
    lines.append("```")

# ── Busiest days summary ──
day_counts = Counter(r['date'] for r in results)
busy_days = [(d, c) for d, c in day_counts.items()
             if datetime.strptime(d, '%Y-%m-%d').replace(tzinfo=timezone.utc) < today + timedelta(days=40)]
busy_days.sort()

total_in_view = len(notable_events)
total_all = len(results)
tracked_count = sum(1 for r in notable_events if r['symbol'] in WATCHLIST)

lines.append(f"\n**📊 最忙日子**  ·  {total_all} total · {total_in_view} 巨企 · {tracked_count} 🎯")
lines.append("```")
lines.append(f"{'Day':>12} | {'Count':>5} | {'巨企':>5} | Flags")
lines.append(f"{'-'*12}-+-{'-'*5}-+-{'-'*5}-+-{'-'*25}")
for date, count in busy_days:
    d = datetime.strptime(date, '%Y-%m-%d')
    notable_on_day = sum(1 for r in notable_events if r['date'] == date)
    tracked_on_day = sum(1 for r in notable_events if r['symbol'] in WATCHLIST and r['date'] == date)
    if count >= 80 or notable_on_day >= 5 or tracked_on_day > 0:
        flags = []
        if notable_on_day >= 10: flags.append("🔥MEGA")
        elif notable_on_day >= 5: flags.append("🔥")
        if tracked_on_day > 0: flags.append(f"🎯x{tracked_on_day}")
        flag_str = ' '.join(flags)
        lines.append(f"{d.strftime('%a %b %d'):>12} | {count:>5d} | {notable_on_day:>5d} | {flag_str}")
lines.append("```")

next_dates = [datetime.strptime(d, '%Y-%m-%d').strftime('%b %d') for d, _ in busy_days[:3]]
lines.append(f"\n_Data: Nasdaq API_ · _Next: {'; '.join(next_dates)}_")

# ── Write to common-financial-data for other agents ──
if pathlib.Path('/Users/oscary/docker-data').exists():
    output_dir = pathlib.Path('/Users/oscary/docker-data/common-financial-data')
else:
    output_dir = pathlib.Path('/docker-data/common-financial-data')
output_dir.mkdir(parents=True, exist_ok=True)

minimal = []
for r in results:
    minimal.append({
        'date': r['date'],
        'symbol': r['symbol'],
        'name': r['name'],
        'mcap': r['mcap'],
        'eps_est': r['eps'],
        'time': r['time'],
        'notable': r in notable_events
    })

calendar_data = {
    'generated_at': today.isoformat(),
    'generated_by': 'earnings_briefing.py',
    'total_events': len(results),
    'notable_events': len(notable_events),
    'tracked_count': tracked_count,
    'events': minimal
}

with open(output_dir / 'earnings_calendar.json', 'w') as f:
    json.dump(calendar_data, f, indent=2)

print('\n'.join(lines))
