import '../styles/globals.css'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'

export default function App({ Component, pageProps }) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  const isActive = (path) => router.pathname === path ? 'active' : ''

  const links = [
    { href: '/', label: 'Dashboard' },
    { href: '/daily-ops', label: 'Daily Ops' },
    { href: '/deep-dive', label: 'Deep Dive Candidate' },
    { href: '/deep-dive-results', label: 'Deep Dive Result' },
    { href: '/holdings', label: 'Holdings' },
    { href: '/charts', label: 'Charts' },
    { href: '/long-trade-system', label: 'Long Trade System' },
    { href: '/day-trading-system', label: 'Day Trading' },
    { href: '/system', label: 'System' },
  ]

  return (
    <>
      <nav className="nav">
        <div className="nav-inner">
          <Link href="/" className="nav-brand">📈 Equity Lab</Link>
          <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
            {links.map(l => (
              <Link key={l.href} href={l.href} className={`nav-link ${isActive(l.href)}`} onClick={() => setMenuOpen(false)}>
                {l.label}
              </Link>
            ))}
          </div>
          <button className={`nav-toggle ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            <span></span><span></span><span></span>
          </button>
        </div>
      </nav>
      {menuOpen && <div className="nav-overlay" onClick={() => setMenuOpen(false)} />}
      <Component {...pageProps} />
    </>
  )
}
