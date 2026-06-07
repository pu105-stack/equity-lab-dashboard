import { useState, useEffect, useRef } from 'react'

const DEFAULT_TICKER = 'NVDA'

export default function Charts() {
  const [ticker, setTicker] = useState(DEFAULT_TICKER)
  const [input, setInput] = useState(DEFAULT_TICKER)
  const chartRef = useRef(null)
  const widgetRef = useRef(null)

  // Load chart when ticker changes
  useEffect(() => {
    if (!chartRef.current) return

    // Clean up old widget
    if (widgetRef.current) {
      chartRef.current.innerHTML = ''
    }

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/tv.js'
    script.async = true
    script.onload = () => {
      if (window.TradingView && chartRef.current) {
        widgetRef.current = new window.TradingView.widget({
          container_id: 'tv-chart',
          width: '100%',
          height: 600,
          symbol: ticker,
          interval: 'D',
          timezone: 'America/New_York',
          theme: 'dark',
          style: '1',
          locale: 'en',
          toolbar_bg: '#0d1117',
          enable_publishing: false,
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: false,
          studies: ['RSI@tv-basicstudies', 'MASimple@tv-basicstudies'],
          show_popup_button: true,
          popup_width: '1000',
          popup_height: '650',
        })
      }
    }
    chartRef.current.appendChild(script)

    return () => {
      widgetRef.current = null
    }
  }, [ticker])

  const handleSubmit = (e) => {
    e.preventDefault()
    setTicker(input.toUpperCase().trim())
  }

  const presets = ['NVDA', 'AAPL', 'MSFT', 'TSLA', 'AMD', 'QQQ', 'SPY']

  return (
    <div className="container">
      {/* Header */}
      <div className="header">
        <div>
          <h1>📈 Charts</h1>
          <p className="header-sub">TradingView — Technical Charts</p>
        </div>
        <span className="build-badge">v1.0 · Jun 2026</span>
      </div>

      {/* Ticker Input */}
      <form onSubmit={handleSubmit} className="ticker-form">
        <div className="ticker-input-group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter ticker..."
            className="ticker-input"
            spellCheck={false}
          />
          <button type="submit" className="ticker-btn">Load Chart</button>
        </div>
        <div className="preset-bar">
          {presets.map(p => (
            <button
              key={p}
              type="button"
              className={`preset-btn ${ticker === p ? 'active' : ''}`}
              onClick={() => { setTicker(p); setInput(p) }}
            >
              {p}
            </button>
          ))}
        </div>
      </form>

      {/* Chart */}
      <div className="chart-card">
        <div className="chart-hd">
          <span className="chart-label">{ticker}</span>
          <a
            href={`https://www.tradingview.com/chart/?symbol=${ticker}`}
            target="_blank"
            rel="noopener noreferrer"
            className="chart-open-btn"
          >
            Open in TradingView ↗
          </a>
        </div>
        <div ref={chartRef} id="tv-chart" className="chart-container" />
      </div>

      <div className="footer">
        <span>🔹 Charts powered by TradingView · Data delayed by exchange</span>
        <span className="deploy-badge">⚡ v1.0 · 2026-06</span>
      </div>

      <style jsx global>{`
        .container { max-width: 1200px; margin: 0 auto; padding: 24px; color: #f0f6fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
        .header-sub { font-size: 14px; color: #6b7280; margin-top: 4px; }
        .build-badge { font-size: 12px; padding: 4px 12px; border-radius: 8px; background: #1e293b; color: #94a3b8; border: 1px solid #334155; white-space: nowrap; }

        /* Ticker Form */
        .ticker-form { margin-bottom: 20px; }
        .ticker-input-group { display: flex; gap: 8px; }
        .ticker-input {
          flex: 1; padding: 12px 16px; border-radius: 8px; border: 1px solid #30363d;
          background: #0d1117; color: #f0f6fc; font-size: 18px; font-weight: 700;
          font-family: 'SF Mono', 'Fira Code', monospace; outline: none; letter-spacing: 1px;
        }
        .ticker-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
        .ticker-input::placeholder { color: #30363d; font-weight: 400; font-size: 14px; letter-spacing: 0; }
        .ticker-btn {
          padding: 12px 24px; border-radius: 8px; border: none; background: #6366f1;
          color: #fff; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.15s;
        }
        .ticker-btn:hover { background: #4f46e5; }
        .preset-bar { display: flex; gap: 6px; margin-top: 10px; flex-wrap: wrap; }
        .preset-btn {
          padding: 6px 14px; border-radius: 6px; border: 1px solid #30363d;
          background: #0d1117; color: #94a3b8; font-size: 12px; font-weight: 600;
          cursor: pointer; transition: all 0.15s; font-family: 'SF Mono', 'Fira Code', monospace;
        }
        .preset-btn:hover { border-color: #6366f1; color: #6366f1; }
        .preset-btn.active { background: #6366f1; border-color: #6366f1; color: #fff; }

        /* Chart Card */
        .chart-card { background: #161b22; border: 1px solid #21262d; border-radius: 12px; overflow: hidden; }
        .chart-hd {
          display: flex; justify-content: space-between; align-items: center;
          padding: 12px 16px; border-bottom: 1px solid #21262d;
        }
        .chart-label { font-size: 16px; font-weight: 700; color: #f0f6fc; font-family: 'SF Mono', 'Fira Code', monospace; }
        .chart-open-btn {
          font-size: 12px; color: #6366f1; text-decoration: none; padding: 6px 12px;
          border-radius: 6px; background: rgba(99,102,241,0.1); transition: all 0.15s;
        }
        .chart-open-btn:hover { background: rgba(99,102,241,0.2); }
        .chart-container { min-height: 600px; }

        /* Footer */
        .footer { display: flex; justify-content: space-between; align-items: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #21262d; font-size: 12px; color: #6b7280; }
        .deploy-badge { font-size: 11px; color: #4b5563; }
      `}</style>
    </div>
  )
}
