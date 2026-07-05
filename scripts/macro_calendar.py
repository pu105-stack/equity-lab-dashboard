#!/usr/bin/env python3
"""Macro Economic Calendar — fetch from TradingView API, filter US events, deliver briefing + write to common-financial-data."""
import json, os, sys, pathlib, urllib.request
from datetime import datetime, timedelta, timezone, date

API_URL = "https://economic-calendar.tradingview.com/events"
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Origin': 'https://www.tradingview.com',
    'Referer': 'https://www.tradingview.com/',
}

# macOS host vs Docker container path
if pathlib.Path('/Users/oscary/docker-data').exists():
    BASE_DIR = pathlib.Path('/Users/oscary/docker-data')
else:
    BASE_DIR = pathlib.Path('/docker-data')

OUTPUT_DIR = BASE_DIR / 'common-financial-data'

today = date.today()
from_date = today.isoformat()
to_date = (today + timedelta(days=14)).isoformat()

url = f"{API_URL}?from={from_date}&to={to_date}&countries=US"
req = urllib.request.Request(url, headers=HEADERS)

try:
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read().decode())
except Exception as e:
    print(f"⚠️ Macro Calendar API failed: {e}", file=sys.stderr)
    sys.exit(1)

events = data.get('result', [])

# ── Classify importance ──
def importance_label(imp):
    if imp == 1: return 'HIGH'
    elif imp == 0: return 'MEDIUM'
    else: return 'low'

high_events = [e for e in events if e['importance'] == 1]
med_events  = [e for e in events if e['importance'] == 0]
low_events  = [e for e in events if e.get('indicator') == 'Holidays']

# ── Write JSON to common-financial-data (graceful if running outside Docker) ──
try:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
except (OSError, FileNotFoundError):
    json_written = False
else:
    json_written = True

macro_data = {
    'generated_at': datetime.now(timezone.utc).isoformat(),
    'generated_by': 'macro_calendar.py',
    'source': 'TradingView',
    'date_range': {'from': from_date, 'to': to_date},
    'summary': {
        'high': len(high_events),
        'medium': len(med_events),
        'total_non_holiday': len([e for e in events if e.get('indicator') != 'Holidays']),
    },
    'events': [{
        'id': e['id'],
        'date': e['date'],
        'title': e['title'],
        'indicator': e.get('indicator', ''),
        'category': e.get('category', ''),
        'importance': importance_label(e['importance']),
        'importance_raw': e['importance'],
        'previous': e.get('previous'),
        'forecast': e.get('forecast'),
        'actual': e.get('actual'),
        'currency': e.get('currency', ''),
        'source': e.get('source', ''),
        'period': e.get('period', ''),
        'ticker': e.get('ticker', ''),
        'comment': e.get('comment', '')[:500],
    } for e in events if e.get('indicator') != 'Holidays'],
}

if json_written:
    with open(OUTPUT_DIR / 'macro_calendar.json', 'w') as f:
        json.dump(macro_data, f, indent=2, ensure_ascii=False)

# ── Also write a concise version (high + medium only) ──
concise = {
    'generated_at': macro_data['generated_at'],
    'high': [{
        'date': e['date'], 'title': e['title'],
        'previous': e['previous'], 'forecast': e['forecast'],
        'period': e['period'], 'source': e['source'],
    } for e in macro_data['events'] if e['importance'] == 'HIGH'],
    'medium': [{
        'date': e['date'], 'title': e['title'],
        'previous': e['previous'], 'forecast': e['forecast'],
        'period': e['period'], 'source': e['source'],
    } for e in macro_data['events'] if e['importance'] == 'MEDIUM'],
}

# ── Generate briefing text ──
lines = []
lines.append(f"📅 **Macro Economic Calendar** — {today.strftime('%b %d, %Y')}")
lines.append(f"   Next 14 days · {macro_data['summary']['total_non_holiday']} US events")
lines.append("")

if high_events:
    lines.append("🔴 **High Impact**")
    lines.append("```")
    lines.append(f"{'Date':>12} | {'Event':40s} | {'Prev':>8s} | {'Fcast':>8s}")
    lines.append(f"{'-'*12}-+-{'-'*40}-+-{'-'*8}-+-{'-'*8}")
    for e in sorted(high_events, key=lambda x: x['date']):
        dt = datetime.fromisoformat(e['date'].replace('Z', '+00:00'))
        d_str = dt.strftime('%a %b %d')
        prev = str(e.get('previous', '') or '—')
        fcast = str(e.get('forecast', '') or '—')
        lines.append(f"{d_str:>12} | {e['title']:40s} | {prev:>8s} | {fcast:>8s}")
    lines.append("```")
    lines.append("")

if med_events:
    lines.append("🟡 **Medium Impact**")
    lines.append("```")
    lines.append(f"{'Date':>12} | {'Event':40s} | {'Prev':>8s} | {'Fcast':>8s}")
    lines.append(f"{'-'*12}-+-{'-'*40}-+-{'-'*8}-+-{'-'*8}")
    for e in sorted(med_events, key=lambda x: x['date']):
        dt = datetime.fromisoformat(e['date'].replace('Z', '+00:00'))
        d_str = dt.strftime('%a %b %d')
        prev = str(e.get('previous', '') or '—')
        fcast = str(e.get('forecast', '') or '—')
        lines.append(f"{d_str:>12} | {e['title']:40s} | {prev:>8s} | {fcast:>8s}")
    lines.append("```")
    lines.append("")

if not high_events and not med_events:
    lines.append("📭 冇高/中影響力嘅 US 經濟數據喺未來兩週。")
    lines.append("")

lines.append(f"_Data: TradingView_ · _{from_date} → {to_date}_")

print('\n'.join(lines))
