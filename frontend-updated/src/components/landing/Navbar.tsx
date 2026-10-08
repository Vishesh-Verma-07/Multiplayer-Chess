'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { BRAND, NAV_LINKS, PLAY_URL } from '../../lib/config'
import { Logo } from './Logo'
import { Arrow } from './parts'
import './Navbar.css'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        toggleRef.current?.focus()
      }
    }
    window.addEventListener('keydown', key)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', key)
    }
  }, [open])

  return (
    <>
      <motion.header
        className={`nav ${scrolled ? 'is-scrolled' : ''} ${open ? 'is-open' : ''}`}
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="nav__inner wrap">
          <a href="#top" className="nav__brand" aria-label={`${BRAND} home`}>
            <Logo />
            <span>{BRAND}</span>
          </a>
          <nav className="nav__links" aria-label="Primary">
            {NAV_LINKS.map((l) => (
              <Link key={l.href} href={l.href}>
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="nav__right">
            <Link className="nav__signin" href="/auth">
              Sign in
            </Link>
            <Link className="btn btn-primary btn-sm nav__cta" href={PLAY_URL}>
              Play Now <Arrow />
            </Link>
            <button
              ref={toggleRef}
              className="nav__toggle"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? 'Close menu' : 'Open menu'}
              onClick={() => setOpen((o) => !o)}
            >
              <span />
              <span />
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            className="drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.55, ease: [0.76, 0, 0.24, 1] }}
          >
            <div className="drawer__board" aria-hidden="true" />
            <nav className="drawer__links" aria-label="Mobile">
              {NAV_LINKS.map((l, i) => (
                <motion.a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18 + i * 0.07, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span className="mono">0{i + 1}</span>
                  {l.label}
                </motion.a>
              ))}
            </nav>
            <motion.div className="drawer__foot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
              <Link className="btn btn-primary" href={PLAY_URL}>
                Play Now <Arrow />
              </Link>
              <Link className="btn btn-ghost" href="/auth">
                Sign in
              </Link>
              <p className="mono">e2 → e4 · real-time</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
