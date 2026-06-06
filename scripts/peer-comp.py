#!/usr/bin/env python3
"""
Peer Comparison — Comps table with sector benchmarks

Usage:
  python3 peer-comp.py NVDA
  python3 peer-comp.py NVDA --peers "AMD INTC MRVL AVGO"
  python3 peer-comp.py AAPL --peers "MSFT GOOGL AMZN META"
  python3 peer-comp.py AAPL --json
"""

import argparse
import json
import sys
import yfinance as yf

# Sector → default peers (hand-curated)
SECTOR_PEERS = {
    'Technology': {
        'Semiconductors': ['NVDA', 'AMD', 'INTC', 'MRVL', 'AVGO', 'QCOM', 'TXN'],
        'Software—Infrastructure': ['MSFT', 'ORCL', 'CRM', 'ADBE', 'NOW'],
        'Software—Application': ['MSFT', 'ADBE', 'INTU', 'CRM'],
        'Consumer Electronics': ['AAPL', 'SONY', 'GPRO'],
        'Communication Equipment': ['CSCO', 'JNPR', 'HPE', 'CIEN'],
        'Computer Hardware': ['HPQ', 'DELL', 'STX', 'WDC'],
        'Information Technology Services': ['ACN', 'IBM', 'CTSH', 'INFY'],
    },
    'Healthcare': {
        'Biotechnology': ['AMGN', 'GILD', 'REGN', 'VRTX', 'BIIB'],
        'Drug Manufacturers—General': ['PFE', 'MRK', 'ABBV', 'LLY', 'JNJ'],
        'Medical Devices': ['MDT', 'SYK', 'BSX', 'EW', 'ZBH'],
    },
    'Financial Services': {
        'Banks—Diversified': ['JPM', 'BAC', 'WFC', 'C', 'GS'],
        'Asset Management': ['BLK', 'MS', 'APO', 'KKR', 'BX'],
        'Insurance': ['MET', 'PRU', 'AIG', 'ALL', 'CB'],
    },
    'Consumer Cyclical': {
        'Auto Manufacturers': ['TSLA', 'TM', 'F', 'GM', 'RIVN'],
        'Internet Retail': ['AMZN', 'BABA', 'JD', 'MELI', 'SE'],
        'Restaurants': ['MCD', 'SBUX', 'CMG', 'DRI', 'YUM'],
    },
    'Communication Services': {
        'Internet Content & Information': ['GOOGL', 'META', 'SNAP', 'PINS'],
        'Entertainment': ['NFLX', 'DIS', 'WBD', 'PARA'],
        'Telecommunication Services': ['T', 'VZ', 'TMUS'],
    },
    'Energy': {
        'Oil & Gas Integrated': ['XOM', 'CVX', 'BP', 'SHEL', 'TTE'],
        'Oil & Gas E&P': ['COP', 'EOG', 'PXD', 'DVN', 'OXY'],
    },
    'Consumer Defensive': {
        'Beverages—Non-Alcoholic': ['KO', 'PEP', 'KDP', 'MNST'],
        'Household Products': ['PG', 'CL', 'KMB', 'CHD'],
        'Discount Stores': ['WMT', 'COST', 'TGT', 'DG'],
    },
    'Industrials': {
        'Aerospace & Defense': ['GE', 'RTX', 'BA', 'LMT', 'NOC'],
        'Railroads': ['UNP', 'CSX', 'NSC', 'CP', 'CNI'],
    },
    'Real Estate': {
        'REIT—Specialty': ['PLD', 'AMT', 'EQIX', 'DLR'],
    },
    'Utilities': {
        'Utilities—Regulated Electric': ['NEE', 'DUK', 'SO', 'D'],
    },
}


def get_peers_for_ticker(ticker_info):
    """Try to find peers from sector/industry mapping."""
    sector = ticker_info.get('sector', '')
    industry = ticker_info.get('industry', '')
    
    if sector in SECTOR_PEERS:
        # Exact industry match
        if industry in SECTOR_PEERS[sector]:
            return SECTOR_PEERS[sector][industry]
        # First industry in sector as fallback
        return list(SECTOR_PEERS[sector].values())[0]
    
    return []


def get_comp_data(ticker):
    """Get comparable metrics for a ticker."""
    t = yf.Ticker(ticker)
    info = t.info
    
    if not info or not info.get('currentPrice'):
        return None
    
    price = info.get('currentPrice', 0)
    market_cap = info.get('marketCap', 0) or 0
    
    # Core multiples
    pe = info.get('trailingPE')
    fwd_pe = info.get('forwardPE')
    ev_ebitda = info.get('enterpriseToEbitda')
    peg = info.get('pegRatio')
    pb = info.get('priceToBook')
    
    # Margins
    gross_margin = info.get('grossMargins', 0) or 0
    op_margin = info.get('operatingMargins', 0) or 0
    net_margin = info.get('profitMargins', 0) or 0
    
    # Growth
    rev_growth = info.get('revenueGrowth', 0) or 0
    eps_growth = info.get('earningsGrowth', 0) or 0
    
    # FCF
    fcf = info.get('freeCashflow', 0) or 0
    fcf_yield = fcf / market_cap if market_cap else 0
    
    # Returns
    roe = info.get('returnOnEquity', 0) or 0
    roic = info.get('returnOnInvestedCapital', 0) or 0
    
    return {
        'ticker': ticker.upper(),
        'name': info.get('longName', ticker)[:30],
        'price': price,
        'market_cap': market_cap,
        'pe': round(pe, 1) if pe else None,
        'fwd_pe': round(fwd_pe, 1) if fwd_pe else None,
        'ev_ebitda': round(ev_ebitda, 1) if ev_ebitda else None,
        'peg': round(peg, 2) if peg else None,
        'pb': round(pb, 1) if pb else None,
        'gross_margin': round(gross_margin * 100, 1),
        'op_margin': round(op_margin * 100, 1),
        'net_margin': round(net_margin * 100, 1),
        'rev_growth': round(rev_growth * 100, 1),
        'eps_growth': round(eps_growth * 100, 1),
        'fcf_yield': round(fcf_yield * 100, 1),
        'roe': round(roe * 100, 1),
        'roic': round(roic * 100, 1),
    }


def median(values):
    """Calculate median, skipping None values."""
    vals = [v for v in values if v is not None]
    if not vals:
        return None
    vals.sort()
    n = len(vals)
    return vals[n // 2] if n % 2 else (vals[n // 2 - 1] + vals[n // 2]) / 2


def safe_div(a, b):
    if b and b != 0:
        return a / b
    return None


def format_market_cap(v):
    if v >= 1e12:
        return f'{v/1e12:.1f}T'
    elif v >= 1e9:
        return f'{v/1e9:.1f}B'
    elif v >= 1e6:
        return f'{v/1e6:.1f}M'
    return str(v)


def main():
    parser = argparse.ArgumentParser(description='Peer Comparison')
    parser.add_argument('ticker', type=str, help='Stock ticker (e.g. NVDA)')
    parser.add_argument('--peers', type=str, default=None, help='Comma-separated peers (e.g. AMD,INTC)')
    parser.add_argument('--json', action='store_true', help='Output as JSON')
    
    args = parser.parse_args()
    ticker = args.ticker.upper()
    
    # Get main ticker data first (to find sector)
    main_data = get_comp_data(ticker)
    if not main_data:
        print(f"❌ Can't fetch data for {ticker}")
        sys.exit(1)
    
    # Determine peers
    if args.peers:
        peer_list = [p.strip().upper() for p in args.peers.split(',')]
    else:
        # Try auto-detect from sector
        t = yf.Ticker(ticker)
        info = t.info
        peer_list = get_peers_for_ticker(info)
        # Remove the main ticker if it appears in peer list
        peer_list = [p for p in peer_list if p != ticker]
        # Limit to 5
        peer_list = peer_list[:5]
        
        if not peer_list:
            print(f"❌ No default peers for {ticker} ({info.get('sector', '')} / {info.get('industry', '')})")
            print("   Use --peers to specify manually, e.g.:")
            print(f"   python3 peer-comp.py {ticker} --peers \"PEER1,PEER2,PEER3\"")
            sys.exit(1)
    
    # Fetch peer data
    all_data = [main_data]
    failed = []
    for p in peer_list:
        d = get_comp_data(p)
        if d:
            all_data.append(d)
        else:
            failed.append(p)
    
    # Calculate median (excluding main ticker for benchmark)
    peer_data = all_data[1:]  # skip main
    metrics = ['pe', 'fwd_pe', 'ev_ebitda', 'peg', 'pb', 'gross_margin', 
               'op_margin', 'net_margin', 'rev_growth', 'fcf_yield', 'roe', 'roic']
    
    medians = {}
    for m in metrics:
        vals = [d.get(m) for d in peer_data]
        medians[m] = median(vals)
    
    if args.json:
        output = {
            'ticker': ticker,
            'company': main_data['name'],
            'sector': yf.Ticker(ticker).info.get('sector', ''),
            'industry': yf.Ticker(ticker).info.get('industry', ''),
            'peers': [d['ticker'] for d in peer_data],
            'metrics': [],
            'failed': failed,
        }
        for m in metrics:
            row = {'metric': m}
            for d in all_data:
                row[d['ticker']] = d.get(m)
            row['peer_median'] = medians[m]
            output['metrics'].append(row)
        print(json.dumps(output, indent=2))
        return
    
    # Text output
    print(f"\n{'='*85}")
    print(f"  📈 Peer Comparison: {ticker} — {main_data['name']}")
    sector = yf.Ticker(ticker).info.get('sector', '')
    industry = yf.Ticker(ticker).info.get('industry', '')
    print(f"  Sector: {sector}  |  Industry: {industry}")
    print(f"{'='*85}")
    
    # Header
    headers = ['Metric', ticker] + [d['ticker'] for d in peer_data] + ['Median']
    col_width = max(len(h) for h in headers) + 2
    
    # Row formatter
    def row(label, values):
        r = f"  {label:>16}"
        for v in values:
            if v is None:
                r += f"  {'—':>{col_width}}"
            else:
                r += f"  {str(v):>{col_width}}"
        print(r)
    
    sep = f"  {'─'*16}─┬─{'─'*(col_width+2)*(len(all_data)+1)}"
    
    # Price
    print(f"\n  ── Market Data ──")
    row('Price', [f'${d["price"]:.2f}' for d in all_data] + ['—'])
    row('Market Cap', [format_market_cap(d['market_cap']) for d in all_data] + ['—'])
    
    # Valuation
    print(f"\n  ── Valuation ──")
    for m in ['pe', 'fwd_pe', 'ev_ebitda', 'peg', 'pb']:
        vals = [d.get(m) for d in all_data]
        med = medians.get(m)
        med_str = f'{med:.1f}x' if med else '—'
        row(m.upper(), [f'{v:.1f}x' if v else '—' for v in vals] + [med_str])
    
    # Margins
    print(f"\n  ── Margins ──")
    for m in ['gross_margin', 'op_margin', 'net_margin']:
        vals = [d.get(m) for d in all_data]
        med = medians.get(m)
        med_str = f'{med:.1f}%' if med else '—'
        row(m.replace('_', ' ').title(), [f'{v:.1f}%' if v else '—' for v in vals] + [med_str])
    
    # Growth
    print(f"\n  ── Growth ──")
    for m in ['rev_growth', 'eps_growth']:
        vals = [d.get(m) for d in all_data]
        med = medians.get(m)
        med_str = f'{med:.1f}%' if med else '—'
        row(m.replace('_', ' ').title(), [f'{v:.1f}%' if v else '—' for v in vals] + [med_str])
    
    # Returns & FCF
    print(f"\n  ── Efficiency ──")
    row('FCF Yield', [f'{d["fcf_yield"]:.1f}%' if d["fcf_yield"] else '—' for d in all_data] + [f'{medians["fcf_yield"]:.1f}%' if medians.get("fcf_yield") else '—'])
    row('ROE', [f'{d["roe"]:.1f}%' if d["roe"] else '—' for d in all_data] + [f'{medians["roe"]:.1f}%' if medians.get("roe") else '—'])
    row('ROIC', [f'{d["roic"]:.1f}%' if d["roic"] else '—' for d in all_data] + [f'{medians["roic"]:.1f}%' if medians.get("roic") else '—'])
    
    # Premium/discount summary
    print(f"\n  ── vs Median ──")
    premium_metrics = [
        ('P/E', 'pe', False),
        ('EV/EBITDA', 'ev_ebitda', False),
        ('FCF Yield', 'fcf_yield', True),
    ]
    for label, key, higher_better in premium_metrics:
        main_val = main_data.get(key)
        med_val = medians.get(key)
        if main_val and med_val and med_val != 0:
            diff = ((main_val - med_val) / med_val) * 100
            prefix = '+' if diff > 0 else ''
            direction = 'premium' if diff > 0 else 'discount'
            good_bad = '✓' if (higher_better and diff > 0) or (not higher_better and diff < 0) else '⚠️'
            print(f"  {label}: {main_val:.1f} vs {med_val:.1f} median ({prefix}{diff:.0f}% {direction}) {good_bad}")
    
    if failed:
        print(f"\n  ⚠️ Failed to fetch: {', '.join(failed)}")
    
    print(f"\n  🧠 Premium to peers = expensive. Discount = cheap.")
    print(f"     FCF Yield premium is GOOD ✓ | P/E premium is RISKY ⚠️")
    print(f"{'='*85}\n")


if __name__ == '__main__':
    main()
