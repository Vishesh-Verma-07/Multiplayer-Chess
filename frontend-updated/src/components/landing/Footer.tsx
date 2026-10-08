'use client'

import Link from 'next/link'
import { BRAND, PLAY_URL } from '../../lib/config'
import { Logo } from './Logo'

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer__inner">
        <div className="footer__brand">
          <a href="#top" className="nav__brand" aria-label={`${BRAND}, back to top`}>
            <Logo />
            <span>{BRAND}</span>
          </a>
          <p>Chess, built properly for real-time play.</p>
        </div>
        <nav className="footer__nav" aria-label="Footer">
          <Link href={PLAY_URL}>Play</Link>
          <a href="#features">Features</a>
          <a href="#technology">Technology</a>
        </nav>
      </div>
      <div className="wrap footer__base">
       <div className="footer__base-in">
        <span className="mono">© {new Date().getFullYear()} {BRAND}</span>
        <span className="footer__files mono" aria-hidden="true">
          {'abcdefgh'.split('').map((f) => (
            <i key={f}>{f}</i>
          ))}
        </span>
       </div>
      </div>
    </footer>
  )
}
