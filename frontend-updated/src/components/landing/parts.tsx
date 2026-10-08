'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { motion } from 'motion/react'
import './parts.css'

export function Reveal({ children, delay = 0, className, as = 'div' }: { children: ReactNode; delay?: number; className?: string; as?: 'div' | 'li' | 'article' }) {
  const M = motion[as]
  return (
    <M
      className={className}
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </M>
  )
}

export function fmtClock(s: number) {
  const m = Math.floor(s / 60)
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

export function Clock({ seconds, active, running }: { seconds: number; active: boolean; running: boolean }) {
  return <ClockInner key={seconds} seconds={seconds} active={active} running={running} />
}

function ClockInner({ seconds, active, running }: { seconds: number; active: boolean; running: boolean }) {
  const [left, setLeft] = useState(seconds)
  useEffect(() => {
    if (!active || !running) return
    const t = window.setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000)
    return () => window.clearInterval(t)
  }, [active, running])
  return (
    <span className={`clock ${active ? 'is-active' : ''}`} aria-label={`${fmtClock(left)} remaining`}>
      {fmtClock(left)}
    </span>
  )
}

export function PlayerBar({ name, side, seconds, active, running, note }: { name: string; side: 'White' | 'Black'; seconds: number; active: boolean; running: boolean; note?: string }) {
  return (
    <div className={`pbar ${active ? 'is-active' : ''}`}>
      <span className={`pbar__chip pbar__chip--${side === 'White' ? 'w' : 'b'}`} aria-hidden="true" />
      <span className="pbar__name">{name}</span>
      <span className="pbar__side">{note ?? side}</span>
      <Clock seconds={seconds} active={active} running={running} />
    </div>
  )
}

/** Pairs moves into "1. e4 c5" rows. */
export function MoveList({ history, max = 8, className = '' }: { history: string[]; max?: number; className?: string }) {
  const rows: { n: number; w?: string; b?: string }[] = []
  history.forEach((san, i) => {
    if (i % 2 === 0) rows.push({ n: i / 2 + 1, w: san })
    else rows[rows.length - 1].b = san
  })
  const shown = rows.slice(-max)
  const lastIdx = history.length - 1
  return (
    <ol className={`movelist ${className}`} aria-label="Move history">
      {shown.map((r) => {
        const wi = (r.n - 1) * 2
        return (
          <li key={r.n}>
            <span className="movelist__n">{r.n}.</span>
            <span className={`movelist__m ${wi === lastIdx ? 'is-last' : ''}`}>{r.w}</span>
            <span className={`movelist__m ${wi + 1 === lastIdx ? 'is-last' : ''}`}>{r.b ?? ''}</span>
          </li>
        )
      })}
    </ol>
  )
}

export function LiveBadge({ label = 'Live' }: { label?: string }) {
  return (
    <span className="livebadge">
      <span className="dot live" />
      {label}
    </span>
  )
}

export function Arrow() {
  return (
    <span className="arr" aria-hidden="true">
      →
    </span>
  )
}
