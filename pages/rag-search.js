import { useState } from 'react'

export default function RAGSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const search = async () => {
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)
    try {
      const resp = await fetch('/api/rag-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() })
      })
      const data = await resp.json()
      setResults(data.results || [])
    } catch (e) {
      console.error('Search error:', e)
    }
    setLoading(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') search()
  }

  return (
    <div className="container">
      <div className="header">
        <h1>🔎 RAG Search</h1>
        <div className="date">Search past pipeline analysis using AI</div>
      </div>

      {/* Search Bar */}
      <div className="search-bar">
        <input
          className="search-input"
          type="text"
          placeholder="Ask anything... e.g. NVDA catalyst 半導體 outlook"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="search-btn" onClick={search} disabled={loading || !query.trim()}>
          {loading ? '⏳ Searching...' : '🔎 Search'}
        </button>
      </div>

      {/* Results */}
      <div className="results">
        {loading && <div className="loading">Searching embeddings...</div>}

        {!loading && searched && results.length === 0 && (
          <div className="empty">
            <div className="empty-icon">🔬</div>
            <div>No results found</div>
          </div>
        )}

        {results.map((r, i) => (
          <div key={i} className="card">
            <div className="hd">
              <div className="score-badge">{r.score.toFixed(3)}</div>
              <div className="info">
                <div className="pipe-name">{r.pipeline}</div>
                <div className="meta">{r.date}</div>
              </div>
            </div>
            <div className="bd">
              <div className="preview">{r.preview}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="footer">
        <span>🔹 Search across all pipeline analysis using pgvector similarity search</span>
        <span className="deploy-badge">⚡ Live</span>
      </div>

      <style jsx>{`
        .search-bar { display: flex; gap: 10px; margin-bottom: 20px; }
        .search-input { flex: 1; font-size: 16px; padding: 14px 18px; border-radius: 12px; border: 1px solid #334155; background: #0f172a; color: #e2e8f0; outline: none; }
        .search-input:focus { border-color: #6366f1; }
        .search-input::placeholder { color: #4b5563; }
        .search-btn { font-size: 16px; font-weight: 600; padding: 14px 28px; border-radius: 12px; border: none; background: #6366f1; color: #fff; cursor: pointer; transition: all 0.2s; }
        .search-btn:hover { background: #818cf8; }
        .search-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .results { display: flex; flex-direction: column; gap: 8px; }
        .loading { text-align: center; padding: 48px; color: #64748b; font-size: 14px; }
        .card { background: #1e293b; border: 1px solid #334155; border-radius: 10px; overflow: hidden; }
        .hd { display: flex; align-items: center; gap: 12px; padding: 14px 16px; }
        .score-badge { font-size: 13px; font-weight: 700; font-family: monospace; padding: 4px 10px; border-radius: 6px; background: rgba(99,102,241,0.15); color: #818cf8; flex-shrink: 0; min-width: 50px; text-align: center; }
        .info { flex: 1; }
        .pipe-name { font-size: 14px; font-weight: 600; color: #e2e8f0; }
        .meta { font-size: 12px; color: #64748b; margin-top: 2px; }
        .bd { padding: 0 16px 14px; }
        .preview { font-size: 13px; color: #94a3b8; line-height: 1.6; white-space: pre-wrap; }
        .empty { text-align: center; padding: 48px; color: #64748b; }
        .empty-icon { font-size: 40px; margin-bottom: 12px; }
        .footer { margin-top: 20px; }
        
        @media (max-width: 600px) {
          .search-bar { flex-direction: column; }
          .search-btn { width: 100%; }
          .search-input { font-size: 14px; }
        }
      `}</style>
    </div>
  )
}
