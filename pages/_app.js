import '../styles/globals.css'
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function App({ Component, pageProps }) {
  const router = useRouter()
  const isSystem = router.pathname === '/system'

  return (
    <>
      <nav className="nav">
        <div className="nav-inner">
          <div className="nav-brand">📈 Equity Lab</div>
          <div className="nav-links">
            <Link href="/" className={`nav-link ${!isSystem ? 'active' : ''}`}>Dashboard</Link>
            <Link href="/system" className={`nav-link ${isSystem ? 'active' : ''}`}>System</Link>
          </div>
        </div>
      </nav>
      <Component {...pageProps} />
    </>
  )
}
