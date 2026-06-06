import { useState, useEffect } from 'react'
import Link from 'next/link'

const quickLinks = [
  { href: '/daily-ops', icon: '📋', label: 'Daily Ops', desc: '所有 pipeline 最新 output', color: '#3b82f6' },
  { href: '/deep-dive', icon: '🔬', label: 'Deep Dive Candidates', desc: 'New tickers waiting for analysis', color: '#a855f7' },
  { href: '/deep-dive-results', icon: '📊', label: 'Deep Dive Results', desc: 'Completed analyses with BUY/WATCH/PASS', color: '#ec4899' },
  { href: '/rag-search', icon: '🔎', label: 'RAG Search', desc: 'Search past analyses by keyword', color: '#22c55e' },
  { href: '/system', icon: '⚙️', label: 'System Overview', desc: 'Architecture, pipelines, tech stack', color: '#f59e0b' },
]

const pipelineIcons = {
  '新聞分析-NewsCurator': '📰',
  '新聞分析-NewsCurator#1': '📰',
  '開市前掃瞄': '🌅',
  '開市掃瞄': '🌅',
  '美股收市回顧': '🌆',
  '每週篩選': '📊',
}

export default function Home({ latestRuns }) {
  return (
    <div className="container">

      {/* Header */}
      <div className="header">
        <div>
          <h1>📈 <span>Equity</span> Lab</h1>
          <p className="header-sub">AI-Powered Investment Analysis Pipeline</p>
        </div>
        <div className="header-right">
          <span className="status-badge all-ok">● All pipelines operational</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-grid">
        {quickLinks.map(link => (
          <Link key={link.href} href={link.href} className="quick-card" style={{ borderColor: link.color + '30' }}>
            <div className="qc-icon" style={{ background: link.color + '15', color: link.color }}>{link.icon}</div>
            <div className="qc-body">
              <span className="qc-label">{link.label}</span>
              <span className="qc-desc">{link.desc}</span>
            </div>
            <span className="qc-arrow">→</span>
          </Link>
        ))}
      </div>

      {/* Recent Pipeline Runs */}
      <div className="section">
        <div className="section-hd">
          <h2>⏱️ Recent Pipeline Activity</h2>
        </div>
        <div className="runs-list">
          {latestRuns.length === 0 && (
            <div className="empty-state">No recent pipeline runs found</div>
          )}
          {latestRuns.slice(0, 8).map((run, i) => (
            <div key={i} className="run-row">
              <span className="run-icon">{pipelineIcons[run.pipeline] || '📡'}</span>
              <div className="run-meta">
                <span className="run-pipeline">{run.pipeline}</span>
                <span className="run-date">{run.date} {run.time}</span>
              </div>
              <div className="run-status-bar">
                <span className="run-status ok">●</span>
                <span className="run-ok">OK</span>
              </div>
              {run.market_direction && (
                <div className="run-direction">{run.market_direction.slice(0, 120)}{run.market_direction.length > 120 ? '…' : ''}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* System Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">6</div>
          <div className="stat-label">Active Pipelines</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">13</div>
          <div className="stat-label">Analysis Reports (DB)</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">56</div>
          <div className="stat-label">RSS Feeds</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">8,767</div>
          <div className="stat-label">News Headlines Tracked</div>
        </div>
      </div>

      {/* Pipeline Status Summary */}
      <div className="section">
        <div className="section-hd">
          <h2>📡 Pipeline Schedule</h2>
        </div>
        <div className="schedule-grid">
          <div className="schedule-item">
            <span className="sch-time">8pm</span>
            <span className="sch-icon">📰</span>
            <span className="sch-name">News Curator #1</span>
            <span className="sch-desc">Asia/EU news</span>
          </div>
          <div className="schedule-item">
            <span className="sch-time">8:30pm</span>
            <span className="sch-icon">🌅</span>
            <span className="sch-name">Morning Scan</span>
            <span className="sch-desc">Pre-market</span>
          </div>
          <div className="schedule-item">
            <span className="sch-time">8am</span>
            <span className="sch-icon">🌆</span>
            <span className="sch-name">Evening Review</span>
            <span className="sch-desc">Post-mortem</span>
          </div>
          <div className="schedule-item">
            <span className="sch-time">8am</span>
            <span className="sch-icon">📰</span>
            <span className="sch-name">News Curator #2</span>
            <span className="sch-desc">US news</span>
          </div>
          <div className="schedule-item">
            <span className="sch-time">Sat 6am</span>
            <span className="sch-icon">📊</span>
            <span className="sch-name">Weekly Screen</span>
            <span className="sch-desc">Signal filter</span>
          </div>
          <div className="schedule-item">
            <span className="sch-time">9–18h</span>
            <span className="sch-icon">🔬</span>
            <span className="sch-name">Deep Dive</span>
            <span className="sch-desc">Every 3h</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="footer">
        <span>🔹 Equity Lab — Decision Support System</span>
        <span className="deploy-badge">⚡ Live from daily-ops.json</span>
      </div>

      <style jsx>{`
        .header-sub { font-size: 14px; color: #6b7280; margin-top: 4px; }
        .header-right { display: flex; align-items: center; gap: 12px; }
        .status-badge { font-size: 12px; padding: 5px 12px; border-radius: 8px; font-weight: 600; }
        .status-badge.all-ok { color: #4ade80; background: rgba(74,222,128,0.1); border: 1px solid rgba(74,222,128,0.2); }

        /* Quick Links */
        .quick-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; margin-bottom: 24px; }
        .quick-card { display: flex; align-items: center; gap: 12px; padding: 14px; background: #161b22; border: 1px solid #21262d; border-radius: 10px; text-decoration: none; transition: all 0.15s; }
        .quick-card:hover { background: #1c2128; border-color: #30363d; }
        .qc-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
        .qc-body { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .qc-label { font-size: 14px; font-weight: 600; color: #f0f6fc; }
        .qc-desc { font-size: 11px; color: #6b7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .qc-arrow { font-size: 14px; color: #4b5563; flex-shrink: 0; }

        /* Section */
        .section { background: #161b22; border: 1px solid #21262d; border-radius: 12px; margin-bottom: 20px; overflow: hidden; }
        .section-hd { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; }
        .section-hd h2 { font-size: 15px; font-weight: 600; color: #f0f6fc; }

        /* Runs List */
        .runs-list { padding: 0 20px 16px; }
        .run-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid #1c2128; }
        .run-row:last-child { border-bottom: none; }
        .run-icon { font-size: 16px; flex-shrink: 0; }
        .run-meta { display: flex; flex-direction: column; gap: 1px; min-width: 160px; }
        .run-pipeline { font-size: 13px; font-weight: 600; color: #f0f6fc; }
        .run-date { font-size: 11px; color: #6b7280; }
        .run-status-bar { display: flex; align-items: center; gap: 4px; }
        .run-status.ok { color: #4ade80; font-size: 10px; }
        .run-ok { font-size: 11px; font-weight: 600; color: #4ade80; }
        .run-direction { font-size: 12px; color: #9ca3af; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .empty-state { padding: 24px; text-align: center; color: #6b7280; font-size: 14px; }

        /* Stats */
        .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
        @media (max-width: 640px) { .stats-row { grid-template-columns: repeat(2, 1fr); } }
        .stat-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 10px; padding: 16px; text-align: center; }
        .stat-value { font-size: 28px; font-weight: 700; color: #f0f6fc; }
        .stat-label { font-size: 12px; color: #6b7280; margin-top: 4px; }

        /* Schedule */
        .schedule-grid { padding: 0 20px 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        @media (max-width: 600px) { .schedule-grid { grid-template-columns: 1fr; } }
        .schedule-item { display: flex; align-items: center; gap: 10px; padding: 10px; background: #0f172a; border: 1px solid #1e293b; border-radius: 8px; }
        .sch-time { font-size: 12px; font-weight: 700; color: #fbbf24; min-width: 48px; flex-shrink: 0; }
        .sch-icon { font-size: 14px; flex-shrink: 0; }
        .sch-name { font-size: 13px; font-weight: 600; color: #f0f6fc; flex: 1; }
        .sch-desc { font-size: 11px; color: #6b7280; }
      `}</style>
    </div>
  )
}

export async function getStaticProps() {
  let latestRuns = []
  try {
    const fs = await import('fs')
    const path = await import('path')
    const filePath = path.join(process.cwd(), 'data', 'daily-ops.json')
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8')
      const data = JSON.parse(raw)
      latestRuns = data.runs || []
    }
  } catch (e) {
    // Fallback to public/data
    try {
      const fs = await import('fs')
      const path = await import('path')
      const filePath = path.join(process.cwd(), 'public', 'data', 'daily-ops.json')
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8')
        const data = JSON.parse(raw)
        latestRuns = data.runs || []
      }
    } catch (e2) {
      // ignore
    }
  }
  return { props: { latestRuns } }
}
