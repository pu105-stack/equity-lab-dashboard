export default function System() {
  return (
    <div className="container">

      {/* Title */}
      <div className="header">
        <h1>⚙️ System Overview</h1>
      </div>

      {/* Ops Cadence */}
      <h2 className="section-title">📐 Operations Cadence</h2>
      <div className="cadence-grid">

        <div className="cadence-card daily">
          <div className="cadence-hd">
            <span className="cadence-icon">🌅</span>
            <span className="cadence-label">Daily</span>
          </div>
          <div className="cadence-body">
            <div className="cadence-item">
              <span className="cadence-time">AM</span>
              <span>Morning Scan — 開市前篩選異動 & 催化劑</span>
            </div>
            <div className="cadence-item">
              <span className="cadence-time">PM</span>
              <span>Evening Review — 收市後持倉檢討 + 新聞回顧</span>
            </div>
          </div>
        </div>

        <div className="cadence-card weekly">
          <div className="cadence-hd">
            <span className="cadence-icon">📊</span>
            <span className="cadence-label">Weekly</span>
          </div>
          <div className="cadence-body">
            <div className="cadence-item">
              <span className="cadence-time">Wed</span>
              <span>Screening Run — 中段篩選潛在機會</span>
            </div>
            <div className="cadence-item">
              <span className="cadence-time">Sat</span>
              <span>Full Screen — 深度掃描 watchlist</span>
            </div>
          </div>
        </div>

        <div className="cadence-card monthly">
          <div className="cadence-hd">
            <span className="cadence-icon">📈</span>
            <span className="cadence-label">Monthly</span>
          </div>
          <div className="cadence-body">
            <div className="cadence-item">
              <span className="cadence-time">Factor</span>
              <span>Factor Performance Review (Momentum / Value / Quality)</span>
            </div>
            <div className="cadence-item">
              <span className="cadence-time">Direction</span>
              <span>Macro Direction Check — Sector Rotation 評估</span>
            </div>
          </div>
        </div>

        <div className="cadence-card quarterly">
          <div className="cadence-hd">
            <span className="cadence-icon">🔍</span>
            <span className="cadence-label">Quarterly</span>
          </div>
          <div className="cadence-body">
            <div className="cadence-item">
              <span className="cadence-time">Q1-Q4</span>
              <span>Deep Review — Portfolio Attribution + Strategy Calibration</span>
            </div>
          </div>
        </div>

      </div>

      {/* Data Sources */}
      <h2 className="section-title">📡 Data Sources</h2>

      <div className="ds-table-wrap">
        <table className="ds-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Source</th>
              <th>Description</th>
              <th>Frequency</th>
            </tr>
          </thead>
          <tbody>
            {/* Market Data */}
            <tr className="cat-row"><td colSpan={4}><span className="cat-badge price">Price & Market</span></td></tr>
            <tr><td></td><td className="src">FMP Quote</td><td>Current prices, OHLCV, volume, market cap</td><td>Real-time (delayed)</td></tr>
            <tr><td></td><td className="src">FMP Historical</td><td>Daily OHLCV historical EOD prices</td><td>Daily</td></tr>
            <tr><td></td><td className="src">Yahoo Finance</td><td>Historical prices (fallback when FMP rate-limited)</td><td>Daily</td></tr>

            {/* Fundamentals */}
            <tr className="cat-row"><td colSpan={4}><span className="cat-badge funda">Fundamentals</span></td></tr>
            <tr><td></td><td className="src">FMP</td><td>Financial statements, key metrics, ratios, DCF, profiles</td><td>Daily</td></tr>
            <tr><td></td><td className="src">FMP Earnings</td><td>Earnings calendar (epsActual, epsEstimated, revenueActual)</td><td>Daily</td></tr>
            <tr><td></td><td className="src">SEC EDGAR</td><td>10-K, 10-Q filings, insider transactions (Form 4)</td><td>Quarterly</td></tr>

            {/* 13F / Institutional Holdings */}
            <tr className="cat-row"><td colSpan={4}><span className="cat-badge funda">Institutional Holdings</span></td></tr>
            <tr><td></td><td className="src">SEC EDGAR 13F</td><td>Institutional holdings — 大行持倉、hedge fund portfolio (skill: sec-edgar-13f ✅)</td><td>Quarterly</td></tr>

            {/* News & Sentiment */}
            <tr className="cat-row"><td colSpan={4}><span className="cat-badge news">News & Sentiment</span></td></tr>
            <tr><td></td><td className="src">RSS Feeds (63+ sources)</td><td>Aggregated news (Bloomberg, WSJ, CNBC, Benzinga, etc.)</td><td>Real-time</td></tr>
            <tr><td></td><td className="src">Finnhub News</td><td>Ticker-specific news & earnings transcripts</td><td>On-demand</td></tr>
            <tr><td></td><td className="src">Marketaux</td><td>Financial news with entity-level sentiment scoring</td><td>Real-time</td></tr>
            <tr><td></td><td className="src">Tiingo</td><td>Smart ticker-tagged news (CUDA → NVDA)</td><td>On-demand</td></tr>
            <tr><td></td><td className="src">Reddit (r/wallstreetbets)</td><td>Sentiment monitoring & retail flow</td><td>Daily</td></tr>

            {/* Economic */}
            <tr className="cat-row"><td colSpan={4}><span className="cat-badge econ">Economic & Macro</span></td></tr>
            <tr><td></td><td className="src">FRED</td><td>US macro data (GDP, CPI, PMI, employment, yield curve)</td><td>Weekly</td></tr>
            <tr><td></td><td className="src">Wikipedia</td><td>S&P 500 constituent list (sector, industry, GICS)</td><td>Monthly</td></tr>

            {/* Screening */}
            <tr className="cat-row"><td colSpan={4}><span className="cat-badge screen">Screening & Analytics</span></td></tr>
            <tr><td></td><td className="src">In-app Screening</td><td>Multi-factor scoring (Track A: Balanced, Track B: Momentum)</td><td>Weekly</td></tr>
            <tr><td></td><td className="src">Risk Calculator</td><td>VaR, drawdown, beta, correlation</td><td>On-demand</td></tr>
            <tr><td></td><td className="src">Portfolio Monitor</td><td>Exposure snapshot, concentration checks</td><td>Daily</td></tr>
            <tr><td></td><td className="src">Finviz</td><td>Sector heatmaps, visual screening (manual reference)</td><td>Reference</td></tr>

            {/* Infrastructure */}
            <tr className="cat-row"><td colSpan={4}><span className="cat-badge infra">Infrastructure</span></td></tr>
            <tr><td></td><td className="src">PostgreSQL (equity-db)</td><td>Local storage for historical data</td><td>—</td></tr>
            <tr><td></td><td className="src">Neon DB (pending)</td><td>Cloud storage for backup & sharing</td><td>—</td></tr>
            <tr><td></td><td className="src">n8n (equity-net)</td><td>Workflow automation & data pipelines</td><td>—</td></tr>
            <tr><td></td><td className="src">Vercel</td><td>Dashboard hosting (static Next.js)</td><td>—</td></tr>
          </tbody>
        </table>
        <div className="ds-note">📁 All sources above live under <code>data-sources/</code> skill category</div>
      </div>

      {/* Footer */}
      <div className="footer">
        <span>🔹 Equity Lab — Decision Support System</span>
        <span className="deploy-badge">⚡ Deploy: 2026-06-01</span>
      </div>
    </div>
  )
}
