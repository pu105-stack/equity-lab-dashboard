#!/usr/bin/env python3
"""
DCF Model — Fair value + sensitivity table

Usage:
  python3 dcf.py AAPL
  python3 dcf.py NVDA --wacc 0.12 --growth 0.20 --terminal-growth 0.03 --years 5
  python3 dcf.py MSFT --wacc 0.09 --growth 0.12 --terminal-growth 0.025 --years 10
"""

import argparse
import json
import sys
import yfinance as yf

def get_financials(ticker):
    """Get core data for DCF calculation."""
    t = yf.Ticker(ticker)
    info = t.info

    # Get FCF
    fcf = info.get('freeCashflow')
    if not fcf:
        # Fallback: operating cashflow - capex
        oc = info.get('operatingCashflow')
        capex = info.get('capitalExpenditures')
        if oc and capex:
            fcf = oc - abs(capex)
    
    if not fcf:
        # Try financial statements
        cf = t.cashflow
        if cf is not None and not cf.empty:
            try:
                fcf = cf.loc['Free Cash Flow'].iloc[0]
            except KeyError:
                try:
                    op_cf = cf.loc['Operating Cash Flow'].iloc[0]
                    cap_ex = cf.loc['Capital Expenditure'].iloc[0]
                    fcf = op_cf + cap_ex  # cap_ex is negative
                except KeyError:
                    pass

    # Get debt, cash, shares
    debt = info.get('totalDebt', 0) or 0
    cash = info.get('totalCash', 0) or 0
    shares = info.get('sharesOutstanding', 0) or 0
    price = info.get('currentPrice', 0) or 0
    market_cap = info.get('marketCap', 0) or 0
    
    # Revenue for growth context
    revenue = info.get('totalRevenue', 0) or 0
    revenue_growth = info.get('revenueGrowth', 0) or 0
    
    # Tax rate estimate
    pretax_income = info.get('incomeBeforeTax', 0) or 0
    tax = info.get('incomeTaxExpense', 0) or 0
    tax_rate = abs(tax / pretax_income) if pretax_income else 0.21
    
    return {
        'fcf': fcf,
        'debt': abs(debt),
        'cash': abs(cash),
        'shares': shares,
        'price': price,
        'market_cap': market_cap,
        'revenue': revenue,
        'revenue_growth': revenue_growth,
        'tax_rate': tax_rate,
        'name': info.get('longName', ticker),
        'sector': info.get('sector', ''),
    }


def dcf_valuation(fcf, growth_rate, wacc, terminal_growth, years=5):
    """Calculate DCF fair value."""
    projected_fcf = []
    discounted_fcf = []
    
    for y in range(1, years + 1):
        pfcf = fcf * (1 + growth_rate) ** y
        projected_fcf.append(pfcf)
        discounted_fcf.append(pfcf / (1 + wacc) ** y)
    
    # Sum of discounted FCF
    sum_pv_fcf = sum(discounted_fcf)
    
    # Terminal value (Gordon Growth Model)
    terminal_fcf = projected_fcf[-1] * (1 + terminal_growth)
    terminal_value = terminal_fcf / (wacc - terminal_growth)
    pv_terminal = terminal_value / (1 + wacc) ** years
    
    # Enterprise value
    ev = sum_pv_fcf + pv_terminal
    
    return {
        'sum_pv_fcf': sum_pv_fcf,
        'terminal_value': terminal_value,
        'pv_terminal': pv_terminal,
        'enterprise_value': ev,
        'projected_fcf': projected_fcf,
        'discounted_fcf': discounted_fcf,
    }


def format_currency(v):
    """Format large numbers."""
    if v >= 1e12:
        return f'${v/1e12:.2f}T'
    elif v >= 1e9:
        return f'${v/1e9:.2f}B'
    elif v >= 1e6:
        return f'${v/1e6:.2f}M'
    else:
        return f'${v:,.0f}'


def main():
    parser = argparse.ArgumentParser(description='DCF Model Calculator')
    parser.add_argument('ticker', type=str, help='Stock ticker (e.g. AAPL)')
    parser.add_argument('--wacc', type=float, default=None, help='WACC (e.g. 0.10 for 10%%)')
    parser.add_argument('--growth', type=float, default=None, help='Revenue/FCF growth rate (e.g. 0.15 for 15%%)')
    parser.add_argument('--terminal-growth', type=float, default=0.03, help='Terminal growth rate (default: 0.03)')
    parser.add_argument('--years', type=int, default=5, help='Projection years (default: 5)')
    parser.add_argument('--json', action='store_true', help='Output as JSON')
    
    args = parser.parse_args()
    
    # Get data
    fin = get_financials(args.ticker)
    
    if not fin['fcf'] or fin['fcf'] == 0:
        print(f"❌ Can't calculate DCF for {args.ticker}: no FCF data")
        print(f"   Company may not be FCF-positive. Try a different stock.")
        sys.exit(1)
    
    # Auto-estimate WACC if not provided
    wacc = args.wacc
    if wacc is None:
        # Simplistic WACC: 8% base + sector risk premium
        sector = fin.get('sector', '')
        premium = {
            'Technology': 0.02,
            'Healthcare': 0.02,
            'Financial Services': 0.015,
            'Consumer Cyclical': 0.025,
            'Communication Services': 0.02,
            'Energy': 0.03,
        }.get(sector, 0.02)
        wacc = 0.08 + premium
    
    # Auto-estimate growth if not provided
    growth = args.growth
    if growth is None:
        growth = fin['revenue_growth']
        if not growth or growth <= 0:
            growth = 0.10  # conservative default
    
    # Run DCF
    result = dcf_valuation(
        fcf=fin['fcf'],
        growth_rate=growth,
        wacc=wacc,
        terminal_growth=args.terminal_growth,
        years=args.years,
    )
    
    # Equity value
    equity_value = result['enterprise_value'] - fin['debt'] + fin['cash']
    fair_value = equity_value / fin['shares'] if fin['shares'] else 0
    current_price = fin['price']
    upside = (fair_value / current_price - 1) * 100 if current_price else 0
    
    # Weight the components
    pv_fcf_pct = (result['sum_pv_fcf'] / result['enterprise_value']) * 100
    pv_terminal_pct = (result['pv_terminal'] / result['enterprise_value']) * 100
    
    if args.json:
        output = {
            'ticker': args.ticker.upper(),
            'company': fin['name'],
            'current_price': current_price,
            'fair_value': round(fair_value, 2),
            'upside_pct': round(upside, 1),
            'assumptions': {
                'wacc': round(wacc, 3),
                'growth_rate': round(growth, 3),
                'terminal_growth': round(args.terminal_growth, 3),
                'projection_years': args.years,
            },
            'inputs': {
                'fcf': fin['fcf'],
                'debt': fin['debt'],
                'cash': fin['cash'],
                'shares_outstanding': fin['shares'],
            },
            'outputs': {
                'sum_pv_fcf': round(result['sum_pv_fcf']),
                'pv_terminal': round(result['pv_terminal']),
                'enterprise_value': round(result['enterprise_value']),
                'equity_value': round(equity_value),
                'fair_value_per_share': round(fair_value, 2),
                'upside': round(upside, 1),
            },
        }
        # Sensitivity table
        output['sensitivity'] = {}
        for w_delta in [-0.005, 0, 0.005]:
            row_key = f'wacc_{wacc+w_delta:.3f}'
            output['sensitivity'][row_key] = {}
            for tg_delta in [-0.01, 0, 0.01]:
                tg = args.terminal_growth + tg_delta
                if tg >= wacc + w_delta:
                    tg = wacc + w_delta - 0.01  # ensure tg < wacc
                r = dcf_valuation(fin['fcf'], growth, wacc + w_delta, tg, args.years)
                ev_eq = r['enterprise_value'] - fin['debt'] + fin['cash']
                fv = ev_eq / fin['shares'] if fin['shares'] else 0
                col_key = f'tg_{tg:.3f}'
                output['sensitivity'][row_key][col_key] = {
                    'fair_value': round(fv, 2),
                    'upside_pct': round((fv / current_price - 1) * 100, 1) if current_price else 0,
                }
        print(json.dumps(output, indent=2))
        return
    
    # Text output
    print(f"\n{'='*60}")
    print(f"  📊 DCF Valuation: {args.ticker.upper()} — {fin['name']}")
    print(f"{'='*60}")
    print(f"\n  Current Price:    ${current_price:.2f}")
    print(f"  Fair Value:       ${fair_value:.2f}")
    print(f"  Upside/Downside:  {upside:+.1f}%")
    print()
    
    print(f"  ── Assumptions ──")
    print(f"  WACC:             {wacc*100:.1f}%")
    print(f"  Growth Rate:      {growth*100:.1f}%")
    print(f"  Terminal Growth:  {args.terminal_growth*100:.1f}%")
    print(f"  Projection:       {args.years} years")
    print()
    
    print(f"  ── Inputs ──")
    print(f"  FCF (TTM):        {format_currency(fin['fcf'])}")
    print(f"  Total Debt:       {format_currency(fin['debt'])}")
    print(f"  Cash:             {format_currency(fin['cash'])}")
    print(f"  Shares Out:       {fin['shares']/1e9:.3f}B")
    print()
    
    print(f"  ── Outputs ──")
    print(f"  PV of FCF:        {format_currency(result['sum_pv_fcf'])} ({pv_fcf_pct:.0f}%)")
    print(f"  PV Terminal:      {format_currency(result['pv_terminal'])} ({pv_terminal_pct:.0f}%)")
    print(f"  Enterprise Value: {format_currency(result['enterprise_value'])}")
    print(f"  Equity Value:     {format_currency(equity_value)}")
    print(f"  Fair Value/Share: ${fair_value:.2f}")
    print()
    
    print(f"  ── Sensitivity (WACC × Terminal Growth) ──")
    print(f"  {'WACC':>8} │ {'TG {:.1%}'.format(args.terminal_growth-0.01):>12} │ {'TG {:.1%}'.format(args.terminal_growth):>12} │ {'TG {:.1%}'.format(args.terminal_growth+0.01):>12}")
    print(f"  {'─'*8}─┼─{'─'*12}─┼─{'─'*12}─┼─{'─'*12}")
    
    for w_delta in [-0.005, 0, 0.005]:
        w = wacc + w_delta
        vals = []
        for tg_delta in [-0.01, 0, 0.01]:
            tg = args.terminal_growth + tg_delta
            if tg >= w:
                tg = w - 0.01
            r = dcf_valuation(fin['fcf'], growth, w, tg, args.years)
            ev_eq = r['enterprise_value'] - fin['debt'] + fin['cash']
            fv = ev_eq / fin['shares'] if fin['shares'] else 0
            ups = (fv / current_price - 1) * 100 if current_price else 0
            vals.append(f'${fv:.0f} ({ups:+.0f}%)')
        
        label = f'{w*100:.1f}%'
        print(f"  {label:>7} │ {vals[0]:>12} │ {vals[1]:>12} │ {vals[2]:>12}")
    
    print(f"\n  🧠 How to read: Center = base case. Left/right = terminal growth ±1%.")
    print(f"    Up/down = WACC ±0.5%. If all cells show upside → strong signal.")
    print(f"{'='*60}\n")


if __name__ == '__main__':
    main()
