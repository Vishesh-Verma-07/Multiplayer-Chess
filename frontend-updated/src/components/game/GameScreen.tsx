'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { Move, PieceSymbol } from 'chess.js'
import { BRAND, MATCH_WAIT_MS } from '../../lib/config'
import type { AuthUser } from '../../lib/auth'
import { PieceGlyph } from '../../lib/pieces'
import { buildMoveRows } from '../../lib/moveRows'
import { useMatch, type MatchResult, type Transport } from '../../lib/useMatch'
import { Logo } from '../landing/Logo'
import { PlayBoard } from './PlayBoard'

const ease = [0.22, 1, 0.36, 1] as const
const VALUE: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }
const ORDER: PieceSymbol[] = ['q', 'r', 'b', 'n', 'p']
type Match = ReturnType<typeof useMatch>
type Tone = 'good' | 'bad' | 'warn' | 'neutral'

export function GameScreen({ token, user, onSignOut, transport, demo = false }: { token: string | null; user: AuthUser; onSignOut: () => void; transport?: Transport; demo?: boolean }) {
  const m = useMatch(token, transport)
  const { phase, color, link } = m

  const caps = useMemo(() => captured(m.moves), [m.moves])
  const diff = caps.w.value - caps.b.value // + = white ahead
  const mineIsWhite = color !== 'black'
  const status = statusLine(m)
  const ghost = m.moves.length ? m.moves[m.moves.length - 1].san : ''
  const live = phase === 'playing'

  return (
    <div className="arena">
      <div className="arena__bg" aria-hidden="true">
        <div className="arena__grid" />
        <AnimatePresence mode="wait">
          {ghost && (
            <motion.span key={m.moves.length} className="arena__ghost" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.9, ease }}>
              {ghost.replace(/[+#]/g, '')}
            </motion.span>
          )}
        </AnimatePresence>
        <div className="arena__grain" />
      </div>

      <header className="arena__bar">
        <div className="arena__bar-l">
          <Link href="/" className="nav__brand" aria-label={`${BRAND} home`}>
            <Logo />
            <span>{BRAND}</span>
          </Link>
          {demo && (
            <span className="demobadge mono" title="Simulated server and opponent. No account or API needed.">
              Demo
            </span>
          )}
        </div>
        <div className="arena__bar-c mono" aria-hidden="true">
          {live ? (
            <>
              <span className="dot live" /> Live · Move {Math.floor(m.moves.length / 2) + 1}
            </>
          ) : phase === 'over' ? (
            'Match finished'
          ) : phase === 'searching' ? (
            'Matchmaking'
          ) : (
            'Lobby'
          )}
        </div>
        <div className="arena__bar-r">
          <LinkPill link={link} demo={demo} />
          <button className="iconbtn" onClick={m.toggleSound} aria-pressed={m.soundOn} aria-label={m.soundOn ? 'Mute move sound' : 'Unmute move sound'} title={m.soundOn ? 'Sound on' : 'Sound off'}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 9v6h4l5 4V5L8 9z" />
              {m.soundOn ? <path d="M16.500 8.500a5 5 0 010 7M19 6a8.500 8.500 0 010 12" /> : <path d="M17 9l5 6M22 9l-5 6" />}
            </svg>
          </button>
          {demo ? (
            <Link className="arena__exit" href="/">
              Exit demo
            </Link>
          ) : (
            <>
              <div className="game__user">
                <span className="game__avatar" aria-hidden="true">{user.username.slice(0, 1).toUpperCase()}</span>
                <span className="game__uname">{user.username}</span>
              </div>
              <button className="arena__exit" onClick={onSignOut}>
                Log out
              </button>
            </>
          )}
        </div>
      </header>

      <main className="arena__main">
        {/* ---- left rail: match status + actions ---- */}
        <aside className="rail rail--match" aria-label="Match">
          <div className="card status">
            <p className="eyebrow">{phase === 'playing' ? 'Live match' : phase === 'over' ? 'Match over' : phase === 'searching' ? 'Matchmaking' : 'Lobby'}</p>
            <motion.h1 key={status.text} className={`status__headline tone-${status.tone}`} aria-live="polite" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease }}>
              {status.text}
            </motion.h1>
            <p className="status__sub">{status.sub}</p>

            <dl className="stats">
              <div>
                <dt>Move</dt>
                <dd className="mono">{live || phase === 'over' ? Math.max(1, Math.ceil(m.moves.length / 2)) : '—'}</dd>
              </div>
              <div>
                <dt>You play</dt>
                <dd>{color ? <span className="stats__side"><i className={color === 'white' ? 'w' : 'b'} />{cap(color)}</span> : '—'}</dd>
              </div>
              <div>
                <dt>Material</dt>
                <dd className="mono">{!color || diff === 0 ? 'Even' : (mineIsWhite ? diff : -diff) > 0 ? `+${Math.abs(diff)}` : `−${Math.abs(diff)}`}</dd>
              </div>
            </dl>
          </div>

          <Notices m={m} />

          <LastMove moves={m.moves} color={color} live={live || phase === 'over'} />

          <div className="card actions">
            {phase === 'playing' ? (
              <>
                <button className="btn btn-ghost" onClick={m.offerDraw} disabled={m.drawSent || link !== 'open' || !!m.drawIncoming}>
                  <span aria-hidden="true">½</span> {m.drawSent ? 'Draw offered' : 'Offer draw'}
                </button>
                <ResignButton onConfirm={m.resign} disabled={link !== 'open'} />
              </>
            ) : (
              <button className="btn btn-primary panel__start" onClick={m.start} disabled={phase === 'searching' || link !== 'open'}>
                {phase === 'searching' ? (
                  <>
                    <span className="auth__spin" aria-hidden="true" /> Searching for opponent…
                  </>
                ) : (
                  <>
                    {phase === 'over' ? 'Find a new match' : 'Start match'} <span className="arr" aria-hidden="true">→</span>
                  </>
                )}
              </button>
            )}
            <p className="actions__hint mono">{live ? 'Drag a piece, or tap it then tap a square.' : 'Pairing takes a few seconds.'}</p>
          </div>
        </aside>

        {/* ---- centre: players + board ---- */}
        <section className="stage" aria-label="Board">
          <PlayerPlate name="Opponent" side={mineIsWhite ? 'Black' : 'White'} active={live && !m.myTurn} caps={mineIsWhite ? caps.b : caps.w} lead={mineIsWhite ? -diff : diff} unknown={phase === 'idle' || phase === 'searching'} />
          <div className="stage__board">
            <PlayBoard match={m} className={phase === 'idle' || phase === 'searching' || link !== 'open' ? 'is-dim' : ''} />
            <Overlays m={m} />
          </div>
          <PlayerPlate name={user.username} side={mineIsWhite ? 'White' : 'Black'} you active={live && m.myTurn} caps={mineIsWhite ? caps.w : caps.b} lead={mineIsWhite ? diff : -diff} />
          <MoveStrip moves={m.moves} />
        </section>

        {/* ---- right rail: moves ---- */}
        <aside className="rail rail--moves" aria-label="Moves">
          <MoveTable moves={m.moves} resumed={m.resumed} />
        </aside>
      </main>
    </div>
  )
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/* ---------- pieces of the screen ---------- */

function captured(moves: Move[]) {
  const w = { list: [] as PieceSymbol[], value: 0 } // pieces White has captured
  const b = { list: [] as PieceSymbol[], value: 0 }
  for (const mv of moves) {
    if (!mv.captured) continue
    const side = mv.color === 'w' ? w : b
    side.list.push(mv.captured)
    side.value += VALUE[mv.captured]
  }
  const sort = (x: PieceSymbol[]) => [...x].sort((a, c) => ORDER.indexOf(a) - ORDER.indexOf(c))
  w.list = sort(w.list)
  b.list = sort(b.list)
  return { w, b }
}

function PlayerPlate({ name, side, you, active, caps, lead, unknown }: { name: string; side: 'White' | 'Black'; you?: boolean; active: boolean; caps: { list: PieceSymbol[] }; lead: number; unknown?: boolean }) {
  const capturedColor = side === 'White' ? 'b' : 'w'
  return (
    <div className={`plate ${active ? 'is-active' : ''} ${you ? 'is-you' : ''}`}>
      <span className={`plate__avatar plate__avatar--${side === 'White' ? 'w' : 'b'}`} aria-hidden="true">
        <PieceGlyph type="k" color={side === 'White' ? 'w' : 'b'} />
      </span>
      <span className="plate__id">
        <span className="plate__name">{name}</span>
        <span className="plate__side mono">{you ? `You · ${side}` : unknown ? 'Waiting…' : side}</span>
      </span>
      <span className="plate__caps" aria-label={caps.list.length ? `Captured ${caps.list.length} pieces` : undefined}>
        <AnimatePresence initial={false}>
          {caps.list.map((t, i) => (
            <motion.span key={t + i} className="cap" initial={{ opacity: 0, scale: 0.4, y: -6 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.4, ease }}>
              <PieceGlyph type={t} color={capturedColor} />
            </motion.span>
          ))}
        </AnimatePresence>
        {lead > 0 && <span className="plate__lead mono">+{lead}</span>}
      </span>
      <span className={`plate__turn mono ${active ? 'on' : ''}`}>
        <i aria-hidden="true" />
        {active ? (you ? 'Your move' : 'Thinking') : ''}
      </span>
    </div>
  )
}

function LinkPill({ link, demo }: { link: 'connecting' | 'open' | 'reconnecting'; demo?: boolean }) {
  const label = link === 'open' ? (demo ? 'Demo server' : 'Connected') : link === 'reconnecting' ? 'Reconnecting…' : 'Connecting…'
  return (
    <span className={`linkpill is-${link}`} role="status">
      <span className="dot" /> {label}
    </span>
  )
}

function ResignButton({ onConfirm, disabled }: { onConfirm: () => void; disabled: boolean }) {
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!armed) return
    const t = window.setTimeout(() => setArmed(false), 3500)
    return () => window.clearTimeout(t)
  }, [armed])
  return (
    <button
      className={`btn btn-danger ${armed ? 'is-armed' : ''}`}
      disabled={disabled}
      onClick={() => {
        if (armed) onConfirm()
        else setArmed(true)
      }}
    >
      <span aria-hidden="true">⚑</span> {armed ? 'Tap again to resign' : 'Resign'}
    </button>
  )
}

function Notices({ m }: { m: Match }) {
  return (
    <div className="notices">
      <AnimatePresence initial={false}>
        {m.drawIncoming && (
          <motion.div key="draw" className="notice notice--draw" role="alert" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease }}>
            <p>
              <strong>{m.drawIncoming.fromUsername}</strong> offered a draw.
            </p>
            <div className="notice__btns">
              <button className="btn btn-primary btn-sm" onClick={() => m.answerDraw(true)}>
                Accept
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => m.answerDraw(false)}>
                Decline
              </button>
            </div>
          </motion.div>
        )}
        {m.error && (
          <motion.p key="err" className="notice notice--error" role="alert" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}>
            <span aria-hidden="true">!</span> {m.error}
          </motion.p>
        )}
        {m.info && !m.error && (
          <motion.p key="info" className="notice notice--info" role="status" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}>
            {m.info}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

function LastMove({ moves, color, live }: { moves: Move[]; color: 'white' | 'black' | null; live: boolean }) {
  const last = moves[moves.length - 1]
  const mine = last && color && (last.color === 'w') === (color === 'white')
  return (
    <div className="card lastmove" aria-live="off">
      {last ? (
        <>
          <p className="lastmove__label mono">Last move · {mine ? 'You' : 'Opponent'}</p>
          <AnimatePresence mode="wait">
            <motion.p key={moves.length} className="lastmove__san" initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0 }} transition={{ duration: 0.6, ease }}>
              {last.san}
            </motion.p>
          </AnimatePresence>
          <p className="lastmove__desc">
            {cap(PIECE_LABEL[last.piece])} {last.from} <span aria-hidden="true">→</span> {last.to}
            {last.captured ? ` · captures ${PIECE_LABEL[last.captured]}` : ''}
          </p>
        </>
      ) : (
        <>
          <p className="lastmove__label mono">{live ? 'First move' : 'How it works'}</p>
          <ul className="tips">
            <li><span className="mono">01</span> Pick a piece to see where it can go.</li>
            <li><span className="mono">02</span> Drag it, or tap the destination square.</li>
            <li><span className="mono">03</span> Every move is checked before it counts.</li>
          </ul>
        </>
      )}
    </div>
  )
}

const PIECE_LABEL: Record<PieceSymbol, string> = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' }

function MoveTable({ moves, resumed }: { moves: Move[]; resumed: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [moves.length])
  const rows = buildMoveRows(moves)
  const last = moves.length - 1
  const lastIsWhite = moves.length > 0 && moves[last].color === 'w'
  return (
    <section className="card moves" aria-label="Move history">
      <div className="moves__title">
        <h2>Moves</h2>
        <span className="mono">{moves.length} ply</span>
      </div>
      <div className="moves__head mono">
        <span>#</span>
        <span>White</span>
        <span>Black</span>
      </div>
      <div ref={ref} className="moves__body">
        {rows.length === 0 ? (
          <div className="moves__empty">
            <span className="moves__empty-grid" aria-hidden="true" />
            <p>{resumed ? 'Moves from before you reconnected aren’t shown. New moves will appear here.' : 'No moves yet. Every move will be listed here as it’s played.'}</p>
          </div>
        ) : (
          rows.map((r, i) => (
            <div key={r.n} className="moves__row">
              <span className="movelist__n mono">{r.n}</span>
              <span className={`mv ${i === rows.length - 1 && lastIsWhite ? 'is-last' : ''}`}>{r.w}</span>
              <span className={`mv ${i === rows.length - 1 && !lastIsWhite ? 'is-last' : ''}`}>{r.b}</span>
            </div>
          ))
        )}
      </div>
    </section>
  )
}

/** Phones: one scrolling line of moves under the board instead of a full table. */
function MoveStrip({ moves }: { moves: Move[] }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (el) el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' })
  }, [moves.length])
  return (
    <div ref={ref} className="strip" aria-hidden="true">
      {moves.length === 0 ? (
        <span className="strip__empty mono">Moves appear here</span>
      ) : (
        moves.map((mv, i) => (
          <span key={i} className={`strip__m ${i === moves.length - 1 ? 'is-last' : ''}`}>
            {mv.color === 'w' && <b className="mono">{Number(mv.before.split(' ')[5]) || i / 2 + 1}</b>}
            {mv.san}
          </span>
        ))
      )}
    </div>
  )
}

/* ---------- state copy ---------- */

function resultCopy(r: MatchResult, color: 'white' | 'black' | null, checkmate: boolean) {
  const won = r.winner && r.winner === color
  const lost = r.winner && color && r.winner !== color
  const reason = (r.reason ?? '').toLowerCase()
  const headline = r.winner ? (won ? 'You won' : lost ? 'You lost' : `${cap(r.winner)} wins`) : 'Draw'
  let sub: string
  if (reason === 'resign') sub = won ? 'Your opponent resigned.' : lost ? 'You resigned.' : 'Won by resignation.'
  else if (reason === 'draw') sub = 'Draw agreed. Well played.'
  else if (reason.includes('stalemate')) sub = 'Stalemate.'
  else if (reason.includes('checkmate') || (checkmate && r.winner)) sub = 'Checkmate.'
  else if (reason) sub = cap(reason.replace(/_/g, ' ')) + '.'
  else sub = r.winner ? 'Game over.' : 'The game ended in a draw.'
  return { headline, sub, tone: (won ? 'good' : lost ? 'bad' : 'neutral') as Tone }
}

function statusLine(m: Match): { text: string; sub: string; tone: Tone } {
  if (m.link !== 'open') return { text: m.link === 'reconnecting' ? 'Reconnecting…' : 'Connecting…', sub: m.link === 'reconnecting' ? 'Your match is saved. We’ll put you back in it.' : 'Establishing a live session with the game server.', tone: 'warn' }
  if (m.phase === 'idle') return { text: 'Ready when you are', sub: 'Start a match to be paired with an opponent.', tone: 'neutral' }
  if (m.phase === 'searching') return { text: 'Finding an opponent', sub: 'Your game starts the moment someone joins.', tone: 'neutral' }
  if (m.phase === 'over' && m.result) {
    const c = resultCopy(m.result, m.color, m.chess.isCheckmate())
    return { text: c.headline, sub: c.sub, tone: c.tone }
  }
  const side = m.color ? `You play ${cap(m.color)}.` : ''
  if (m.chess.isCheckmate()) return { text: 'Checkmate', sub: side, tone: 'warn' }
  if (m.myTurn) return { text: m.inCheck ? 'Your move — check' : 'Your move', sub: `${side} Make your move.`, tone: m.inCheck ? 'warn' : 'good' }
  return { text: m.inCheck ? 'Opponent in check' : 'Opponent’s move', sub: `${side} Waiting for their move.`, tone: 'neutral' }
}

/* ---------- overlays on the board ---------- */

function SearchCard({ searchId }: { searchId: number }) {
  const [left, setLeft] = useState(Math.ceil(MATCH_WAIT_MS / 1000))
  useEffect(() => {
    const started = Date.now()
    const t = window.setInterval(() => setLeft(Math.max(0, Math.ceil((MATCH_WAIT_MS - (Date.now() - started)) / 1000))), 200)
    return () => window.clearInterval(t)
  }, [searchId])
  return (
    <div className="ov__card">
      <span className="ov__radar" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <p className="eyebrow">Searching</p>
      <h2>Waiting for opponent…</h2>
      <p>{left > 0 ? `Pairing you with a player — ${left}s` : 'Still looking. The board lights up as soon as someone joins.'}</p>
      <span key={searchId} className="ov__timer" aria-hidden="true" style={{ ['--wait' as string]: `${MATCH_WAIT_MS}ms` }} />
    </div>
  )
}

function Overlays({ m }: { m: Match }) {
  const [dismissed, setDismissed] = useState(false)
  useEffect(() => setDismissed(false), [m.epoch, m.phase])

  let key = ''
  let body: React.ReactNode = null
  if (m.link !== 'open') {
    key = 'link'
    body = (
      <div className="ov__card">
        <span className="ov__ring" aria-hidden="true" />
        <p className="eyebrow">{m.link === 'reconnecting' ? 'Connection lost' : 'Connecting'}</p>
        <h2>{m.link === 'reconnecting' ? 'Reconnecting…' : 'Connecting to the game server'}</h2>
        <p>{m.link === 'reconnecting' ? 'Your game is saved. You’ll be put right back in it.' : 'The server can take a moment to wake up. Hang tight.'}</p>
      </div>
    )
  } else if (m.phase === 'idle') {
    key = 'idle'
    body = (
      <div className="ov__card">
        <p className="eyebrow">Ready</p>
        <h2>
          Find your <em>opponent.</em>
        </h2>
        <p>You’ll be paired with the next available player and the game begins instantly.</p>
        <button className="btn btn-primary" onClick={m.start}>
          Start match <span className="arr" aria-hidden="true">→</span>
        </button>
      </div>
    )
  } else if (m.phase === 'searching') {
    key = 'search'
    body = <SearchCard searchId={m.searchId} />
  } else if (m.phase === 'over' && m.result && !dismissed) {
    key = 'over'
    const c = resultCopy(m.result, m.color, m.chess.isCheckmate())
    body = (
      <div className={`ov__card ov__card--result tone-${c.tone}`}>
        <p className="eyebrow">Game over</p>
        <h2>{c.headline}</h2>
        <p>{c.sub}</p>
        <div className="ov__btns">
          <button className="btn btn-primary" onClick={m.start}>
            Find a new match <span className="arr" aria-hidden="true">→</span>
          </button>
          <button className="btn btn-ghost" onClick={() => setDismissed(true)}>
            Review board
          </button>
        </div>
      </div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      {body && (
        <motion.div key={key} className="ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }} role={key === 'over' ? 'alertdialog' : 'status'} aria-live="polite">
          <motion.div className="ov__wrap" initial={{ y: 14, scale: 0.98 }} animate={{ y: 0, scale: 1 }} transition={{ duration: 0.5, ease }}>
            {body}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
