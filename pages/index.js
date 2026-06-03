import marketData from '../data/market-summary.json'

export default function Home({ data }) {
  const d = data
  const idx = d.indices

  const pct = (v) => `${v >= 0 ? '+' : ''}${v}%`

  return (
    <div className="container">
      {/* Header */}
      <div className="header">
        <h1>📈 <span>Equity</span> Lab</h1>
        <div className="date">{d.date}</div>
      </div>

      {/* Market Bar */}
      <div className="market-bar">
        <MI label="S&P 500" value={idx.sp500.value.toLocaleString()} chg={idx.sp500.change} fmt={false} />
        <MI label="NASDAQ" value={idx.nasdaq.value.toLocaleString()} chg={idx.nasdaq.change} fmt={false} />
        <MI label="DJIA" value={idx.djia.value.toLocaleString()} chg={idx.djia.change} fmt={false} />
        <MI label="VIX" value={idx.vix.value} chg={idx.vix.change} />
        <MI label="10Y Yield" value={`${idx.treasury_10y.value}%`} chg={idx.treasury_10y.change} />

        <div className="sector-bar">
          {d.sector_leaders.map(s => <span key={s.name} className="sec up">{s.name} +{s.change}%</span>)}
          {d.sector_laggards.map(s => <span key={s.name} className="sec down">{s.name} {s.change}%</span>)}
        </div>
      </div>

      {/* System Status Bar */}
      <div className="status-bar">
        <div className="status-item">
          <span className="status-icon">🌅</span>
          <span className="status-label">Morning Scan</span>
          <span className="status-desc">8pm · Pre-market context</span>
        </div>
        <div className="status-item">
          <span className="status-icon">📰</span>
          <span className="status-label">News Curator</span>
          <span className="status-desc">8pm · Opportunities</span>
        </div>
        <div className="status-item">
          <span className="status-icon">🌆</span>
          <span className="status-label">Evening Review</span>
          <span className="status-desc">8am · Post-mortem</span>
        </div>
        <div className="status-item">
          <span className="status-icon">📊</span>
          <span className="status-label">Weekly Screen</span>
          <span className="status-desc">Wed/Sat · Candidates</span>
        </div>
        <div className="status-item dash">
          <span className="status-icon">📡</span>
          <span className="status-label">Pipeline Hub</span>
          <span className="status-desc">daily-ops → decisions</span>
        </div>
      </div>

      {/* Row 1: Holdings + Watchlist */}
      <div className="grid grid-2">
        <div className="card">
          <div className="card-hd"><h2>💼 持倉</h2><span className="badge">Position</span></div>
          {d.holdings.map(h => (
            <div key={h.ticker} className="s-row">
              <div className="info"><div><div className="tkr">{h.ticker}</div><div className="nm">{h.name}</div></div></div>
              <div><div className={`prc ${h.change >= 0 ? 'positive' : 'negative'}`}>${h.price.toFixed(2)} {pct(h.change)}</div><div className="sub">{h.reason}</div></div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-hd"><h2>⚡ Watchlist</h2><span className="badge">Movers</span></div>
          {d.watchlist.map(w => (
            <div key={w.ticker} className="s-row">
              <div className="info"><div><div className="tkr">{w.ticker}</div><div className="nm">{w.name}</div></div></div>
              <div><div className={`prc ${w.change >= 0 ? 'positive' : 'negative'}`}>{pct(w.change)}</div><div className="sig">{w.signal}</div></div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 2: Screening + News */}
      <div className="grid grid-3">
        <div className="card">
          <div className="card-hd"><h2>📋 Screening</h2><span className="badge">Top 5</span></div>
          <table className="tbl">
            <thead><tr><th>#</th><th>Ticker</th><th>Score</th><th>Factors</th></tr></thead>
            <tbody>
              {d.screening.map(s => (
                <tr key={s.ticker}>
                  <td className="rank">{s.rank}</td>
                  <td className="tkr-c">{s.ticker}</td>
                  <td className={`sc ${s.score >= 7 ? 'positive' : ''}`}>{s.score.toFixed(1)}</td>
                  <td><div className="fts">{s.factors.map(f => {
                    const isPos = f.endsWith('+');
                    const clean = f.replace('+','').replace('-','');
                    return <span key={f} className={`ft ${isPos ? 'up' : 'down'}`}>{clean}</span>;
                  })}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-hd"><h2>📰 News</h2><span className="badge">Highlights</span></div>
          {d.news.map((n, i) => (
            <div key={i} className="n-item">
              <div className="nt">{n.title}</div>
              <div className="nm">
                <span>{n.source}</span>
                <span className={`imp ${n.impact}`}>{n.impact === 'positive' ? '📈' : '📉'} {n.impact}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="footer">
        <span>🔹 Data: {d.date}</span>
        <span className="deploy-badge">⚡ Deploy: 2026-06-01</span>
      </div>
    </div>
  )
}

function MI({ label, value, chg, fmt = true }) {
  return (
    <div className="market-item">
      <span className="label">{label}</span>
      <span className="value">{value}</span>
      <span className={`chg ${chg >= 0 ? 'pos' : 'neg'}`}>{chg >= 0 ? '+' : ''}{chg}{fmt ? '%' : ''}</span>
    </div>
  )
}

export function getStaticProps() {
  return { props: { data: marketData } }
}
