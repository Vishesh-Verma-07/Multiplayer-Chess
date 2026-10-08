'use client'

import { Reveal } from './parts'

const SIGNALS = [
  { k: 'Real-time', v: 'WebSocket gameplay', icon: <path d="M3 12h4l2-6 4 12 2-6h6" /> },
  { k: 'Server-authoritative', v: 'Move validation', icon: <path d="M12 3l8 3v6c0 4.500-3.500 8-8 9-4.500-1-8-4.500-8-9V6zM8.500 12l2.500 2.500 4.500-5" /> },
  { k: 'Persistent', v: 'Games survive reconnects', icon: <path d="M4 7c0-1.700 3.600-3 8-3s8 1.300 8 3-3.600 3-8 3-8-1.300-8-3zm0 0v10c0 1.700 3.600 3 8 3s8-1.300 8-3V7M4 12c0 1.700 3.600 3 8 3s8-1.300 8-3" /> },
  { k: 'Live', v: 'Spectator mode', icon: <path d="M2 12s3.500-7 10-7 10 7 10 7-3.500 7-10 7S2 12 2 12zm10-3a3 3 0 100 6 3 3 0 000-6z" /> },
]

export function ProductSignals() {
  return (
    <section className="signals" aria-label="Product capabilities">
      <div className="wrap">
        <ul className="signals__list">
          {SIGNALS.map((s, i) => (
            <Reveal as="li" key={s.k} delay={i * 0.07} className="signal">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {s.icon}
              </svg>
              <div>
                <p className="signal__k mono">{s.k}</p>
                <p className="signal__v">{s.v}</p>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
