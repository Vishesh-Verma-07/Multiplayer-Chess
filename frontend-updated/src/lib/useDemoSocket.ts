import { Chess, type Move, type PieceSymbol } from 'chess.js'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ClientMessage, ServerMessage, Side } from './protocol'
import type { LinkState } from './useGameSocket'

const VALUE: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }
const rand = (min: number, max: number) => min + Math.random() * (max - min)

/** Cheap opponent: likes captures, checks and centre control, never leaves a piece for free if it can avoid it. */
function pickMove(chess: Chess): Move | null {
  const moves = chess.moves({ verbose: true })
  if (!moves.length) return null
  const scored = moves.map((m) => {
    let score = Math.random() * 1.2
    if (m.captured) score += VALUE[m.captured] * 1.6
    if (m.promotion) score += 8
    if (m.san.includes('#')) score += 100
    else if (m.san.includes('+')) score += 1.5
    if (['d4', 'e4', 'd5', 'e5', 'c4', 'f4', 'c5', 'f5'].includes(m.to)) score += 0.5
    if (m.piece === 'n' || m.piece === 'b') score += chess.history().length < 14 ? 0.8 : 0
    // Is the destination attacked and undefended? Look one ply ahead.
    chess.move(m)
    const replies = chess.moves({ verbose: true })
    const worst = replies.reduce((w, r) => (r.captured && r.to === m.to ? Math.max(w, VALUE[r.captured]) : w), 0)
    if (chess.isCheckmate()) score += 100
    chess.undo()
    score -= worst * 1.1
    return { m, score }
  })
  scored.sort((a, b) => b.score - a.score)
  return scored[0].m
}

/**
 * Stand-in for the game server used by the /game demo. It speaks the same protocol as the
 * real WebSocket (see protocol.ts), so the screen can't tell the difference.
 */
export function useDemoSocket(_token: string | null, onMessage: (m: ServerMessage) => void) {
  const [link, setLink] = useState<LinkState>('connecting')
  const handler = useRef(onMessage)
  useEffect(() => {
    handler.current = onMessage
  })
  const game = useRef<{ chess: Chess; mine: Side; active: boolean; drawOffered: boolean } | null>(null)
  const timers = useRef<number[]>([])

  const later = useCallback((ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms))
  }, [])
  const emit = useCallback((m: ServerMessage) => handler.current(m), [])

  useEffect(() => {
    const t = window.setTimeout(() => setLink('open'), 900)
    const pending = timers.current
    return () => {
      window.clearTimeout(t)
      pending.forEach(window.clearTimeout)
    }
  }, [])

  const finish = useCallback(
    (winner: Side | null, reason: string) => {
      if (game.current) game.current.active = false
      emit({ type: 'game_over', payload: { winner, reason } })
    },
    [emit],
  )

  const opponentMove = useCallback(() => {
    const g = game.current
    if (!g?.active) return
    const m = pickMove(g.chess)
    if (!m) return
    g.chess.move(m)
    emit({ type: 'move', payload: { move: { from: m.from, to: m.to, ...(m.promotion ? { promotion: m.promotion } : {}) } } })
    if (g.chess.isCheckmate()) return finish(g.mine === 'white' ? 'black' : 'white', 'checkmate')
    if (g.chess.isGameOver()) return finish(null, g.chess.isStalemate() ? 'stalemate' : 'draw')
    // Now and then the opponent offers a draw in a quiet middlegame.
    const n = g.chess.history().length
    if (n > 24 && !g.drawOffered && Math.random() < 0.06) {
      g.drawOffered = true
      later(1400, () => g.active && emit({ type: 'draw_request', payload: { fromUsername: 'Opponent', fromColor: g.mine === 'white' ? 'black' : 'white' } }))
    }
  }, [emit, finish, later])

  const send = useCallback(
    (m: ClientMessage) => {
      switch (m.type) {
        case 'init_game': {
          later(rand(500, 900), () => {
            const mine: Side = Math.random() < 0.5 ? 'white' : 'black'
            const chess = new Chess()
            game.current = { chess, mine, active: true, drawOffered: false }
            emit({ type: 'init_game', payload: { fen: chess.fen(), color: mine } })
            if (mine === 'black') later(rand(1200, 2000), opponentMove)
          })
          return true
        }
        case 'move': {
          const g = game.current
          if (!g?.active) return true
          const { from, to, promotion } = m.payload.move
          try {
            g.chess.move({ from, to, ...(promotion ? { promotion } : {}) })
          } catch {
            later(120, () => emit({ type: 'invalid_move', payload: { message: 'Illegal move.' } }))
            return true
          }
          if (g.chess.isCheckmate()) later(300, () => finish(g.mine, 'checkmate'))
          else if (g.chess.isGameOver()) later(300, () => finish(null, g.chess.isStalemate() ? 'stalemate' : 'draw'))
          else later(rand(900, 2300), opponentMove)
          return true
        }
        case 'resign': {
          const g = game.current
          if (g?.active) later(250, () => finish(g.mine === 'white' ? 'black' : 'white', 'resign'))
          return true
        }
        case 'draw_request': {
          const g = game.current
          if (!g?.active) return true
          later(rand(1200, 2200), () => {
            if (!g.active) return
            const accept = g.chess.history().length > 30 && Math.random() < 0.5
            emit({ type: 'draw_response', payload: { accepted: accept, fromColor: g.mine === 'white' ? 'black' : 'white' } })
            if (accept) finish(null, 'draw')
          })
          return true
        }
        case 'draw_response': {
          const g = game.current
          if (m.payload.accepted && g?.active) later(200, () => finish(null, 'draw'))
          return true
        }
      }
    },
    [emit, finish, later, opponentMove],
  )

  return { link, send }
}
