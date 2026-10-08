'use client'

import { useRef, useState, useEffect } from 'react'
import type { Square } from 'chess.js'
import { PieceGlyph, PIECE_NAMES } from '../../lib/pieces'
import type { GameView } from '../../lib/useGame'
import './Board.css'

const FILES = 'abcdefgh'

function coords(sq: Square) {
  return { x: FILES.indexOf(sq[0]), y: 8 - Number(sq[1]) }
}

interface Props {
  game: GameView
  label: string
  /** Subtle 3D response to the pointer (fine pointers only). */
  tilt?: boolean
  /** Tap/click a piece to preview its legal moves. */
  explore?: boolean
  className?: string
  /** Squares to emphasise (e.g. the move being explained). */
  glow?: Square[]
}

export function Board({ game, label, tilt = false, explore = true, className = '', glow }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState<Square | null>(null)
  const [targets, setTargets] = useState<Square[]>([])

  // A new move invalidates any move preview.
  useEffect(() => {
    setSelected(null)
    setTargets([])
  }, [game.ply, game.epoch])

  const onPointerMove = (e: React.PointerEvent) => {
    if (!tilt || e.pointerType !== 'mouse' || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    ref.current.style.setProperty('--ry', `${(px * 5).toFixed(2)}deg`)
    ref.current.style.setProperty('--rx', `${(-py * 5).toFixed(2)}deg`)
  }
  const onPointerLeave = () => {
    ref.current?.style.setProperty('--ry', '0deg')
    ref.current?.style.setProperty('--rx', '0deg')
  }

  const onClick = (e: React.MouseEvent) => {
    if (!explore || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    const file = Math.min(7, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * 8)))
    const rank = 8 - Math.min(7, Math.max(0, Math.floor(((e.clientY - r.top) / r.height) * 8)))
    const sq = `${FILES[file]}${rank}` as Square
    const piece = game.pieces.find((p) => p.square === sq)
    if (!piece || sq === selected) {
      setSelected(null)
      setTargets([])
      return
    }
    setSelected(sq)
    setTargets(game.legalTargets(sq))
  }

  const marks: { sq: Square; kind: string }[] = []
  if (game.lastMove) {
    marks.push({ sq: game.lastMove.from, kind: 'from' }, { sq: game.lastMove.to, kind: 'to' })
  }
  if (game.check) marks.push({ sq: game.check, kind: 'check' })
  if (selected) marks.push({ sq: selected, kind: 'sel' })
  glow?.forEach((sq) => marks.push({ sq, kind: 'glow' }))

  return (
    <div
      ref={ref}
      className={`board ${tilt ? 'board--tilt' : ''} ${className}`}
      role="img"
      aria-label={label}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onClick={onClick}
    >
      <div className="board__squares" />
      {marks.map((m) => {
        const { x, y } = coords(m.sq)
        return <i key={m.kind + m.sq} className={`board__mark board__mark--${m.kind}`} style={{ left: `${x * 12.5}%`, top: `${y * 12.5}%` }} />
      })}
      {targets.map((sq) => {
        const { x, y } = coords(sq)
        const capture = game.pieces.some((p) => p.square === sq)
        return <i key={'t' + sq} className={`board__target ${capture ? 'is-capture' : ''}`} style={{ left: `${x * 12.5}%`, top: `${y * 12.5}%` }} />
      })}
      {game.pieces.map((p, i) => {
        const { x, y } = coords(p.square)
        return (
          <div
            key={p.id}
            className="board__piece"
            style={{ transform: `translate(${x * 100}%, ${y * 100}%)` }}
            data-name={`${p.color === 'w' ? 'white' : 'black'} ${PIECE_NAMES[p.type]}`}
          >
            <span className="board__piece-in" style={{ animationDelay: `${(i % 32) * 18 + 120}ms` }}>
              <PieceGlyph type={p.type} color={p.color} />
            </span>
          </div>
        )
      })}
      <div className="board__files" aria-hidden="true">
        {FILES.split('').map((f) => (
          <span key={f}>{f}</span>
        ))}
      </div>
      <div className="board__ranks" aria-hidden="true">
        {[8, 7, 6, 5, 4, 3, 2, 1].map((r) => (
          <span key={r}>{r}</span>
        ))}
      </div>
    </div>
  )
}
