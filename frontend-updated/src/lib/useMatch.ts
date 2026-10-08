import { Chess, type Move, type PieceSymbol, type Square } from 'chess.js'
import { useCallback, useEffect, useRef, useState } from 'react'
import { MATCH_WAIT_MS } from './config'
import type { ClientMessage, ServerMessage, Side } from './protocol'
import { useGameSocket, type LinkState } from './useGameSocket'
import { applyMoveToPieces, initialPieces, type LastMove, type TrackedPiece } from './useGame'

export type Phase = 'idle' | 'searching' | 'playing' | 'over'

export interface MatchResult {
  winner: Side | null
  reason: string | null
}

interface Snapshot {
  pieces: TrackedPiece[]
  moves: Move[]
  lastMove: LastMove | null
}

interface State extends Snapshot {
  phase: Phase
  color: Side | null
  epoch: number
  result: MatchResult | null
  /** Neutral, informational message (draw declined, reconnected…). */
  info: string | null
  /** Error toast (illegal move, offline…). */
  error: string | null
  drawIncoming: { fromUsername: string } | null
  drawSent: boolean
  /** Moves before a resume are unknown, so history may start mid-game. */
  resumed: boolean
}

const initial = (): State => ({
  pieces: initialPieces(new Chess(), 0),
  moves: [],
  lastMove: null,
  phase: 'idle',
  color: null,
  epoch: 0,
  result: null,
  info: null,
  error: null,
  drawIncoming: null,
  drawSent: false,
  resumed: false,
})

const SOUND_KEY = 'chess_sound'

function useMoveSound() {
  const audio = useRef<HTMLAudioElement | null>(null)
  const [enabled, setEnabled] = useState(true)
  useEffect(() => {
    // Preference is read after mount to keep server and client markup identical.
    try {
      if (localStorage.getItem(SOUND_KEY) === 'off') setEnabled(false)
    } catch {
      /* storage blocked */
    }
  }, [])
  useEffect(() => {
    const a = new Audio('/sounds/chessMove.mp3')
    a.preload = 'auto'
    audio.current = a
    return () => {
      a.pause()
      audio.current = null
    }
  }, [])
  const play = useCallback(() => {
    const a = audio.current
    if (!a || !enabled) return
    a.currentTime = 0
    a.play().catch(() => {})
  }, [enabled])
  const toggle = useCallback(() => {
    setEnabled((e) => {
      try {
        localStorage.setItem(SOUND_KEY, e ? 'off' : 'on')
      } catch {
        /* noop */
      }
      return !e
    })
  }, [])
  return { play, soundOn: enabled, toggleSound: toggle }
}

/** All match state for the /game screen: one chess.js instance, driven by the server. */
export type Transport = (token: string | null, onMessage: (m: ServerMessage) => void) => { link: LinkState; send: (m: ClientMessage) => boolean }

export function useMatch(token: string | null, useTransport: Transport = useGameSocket) {
  const chessRef = useRef(new Chess())
  const pending = useRef<Snapshot | null>(null)
  const [s, setS] = useState<State>(initial)
  const [searchId, setSearchId] = useState(0)
  // While the minimum search time runs, server messages are queued and replayed in order.
  const holding = useRef(false)
  const queue = useRef<ServerMessage[]>([])
  const holdTimer = useRef<number | undefined>(undefined)
  const sRef = useRef(s)
  useEffect(() => {
    sRef.current = s
  })
  const { play, soundOn, toggleSound } = useMoveSound()

  const patch = useCallback((p: Partial<State>) => setS((cur) => ({ ...cur, ...p })), [])

  const applyServerMove = useCallback(
    (from: string, to: string, promotion?: string) => {
      const chess = chessRef.current
      let m: Move
      try {
        m = chess.move({ from, to, ...(promotion ? { promotion } : {}) })
      } catch {
        return // already applied locally or out of sync
      }
      pending.current = null
      setS((cur) => ({ ...cur, pieces: applyMoveToPieces(cur.pieces, m), moves: [...cur.moves, m], lastMove: { from: m.from, to: m.to }, error: null }))
      play()
    },
    [play],
  )

  const process = useCallback(
    (msg: ServerMessage) => {
      switch (msg.type) {
        case 'init_game': {
          const chess = new Chess()
          if (msg.payload?.fen) chess.load(msg.payload.fen)
          chessRef.current = chess
          pending.current = null
          const resumed = !!msg.payload?.resumed
          setS((cur) => ({
            ...initial(),
            epoch: cur.epoch + 1,
            pieces: initialPieces(chess, cur.epoch + 1),
            phase: 'playing',
            color: msg.payload?.color ?? null,
            resumed,
            info: resumed ? 'Reconnected to your active match.' : null,
          }))
          break
        }
        case 'move': {
          const mv = msg.payload?.move
          const from = mv?.from ?? msg.payload?.from
          const to = mv?.to ?? msg.payload?.to
          if (from && to) applyServerMove(from, to, mv?.promotion)
          break
        }
        case 'invalid_move': {
          // Roll back the optimistic move so the board matches the server again.
          const snap = pending.current
          if (snap) {
            try {
              chessRef.current.undo()
            } catch {
              /* noop */
            }
            pending.current = null
            patch({ pieces: snap.pieces, moves: snap.moves, lastMove: snap.lastMove, error: msg.payload?.message ?? 'The server rejected that move.' })
          } else patch({ error: msg.payload?.message ?? 'The server rejected that move.' })
          break
        }
        case 'game_over': {
          patch({
            phase: 'over',
            result: { winner: msg.payload?.winner ?? null, reason: msg.payload?.reason ?? null },
            drawIncoming: null,
            drawSent: false,
            error: null,
            info: null,
          })
          break
        }
        case 'draw_request': {
          if (msg.payload?.fromUsername) patch({ drawIncoming: { fromUsername: msg.payload.fromUsername }, drawSent: false, info: null, error: null })
          break
        }
        case 'draw_response': {
          // The server sends a decline to both players (fromColor is the other side for each),
          // so only the player whose offer is pending needs a message; the decliner already has one.
          if (msg.payload?.accepted === false && sRef.current.drawSent) patch({ drawSent: false, info: 'Your draw offer was declined.' })
          break
        }
      }
    },
    [applyServerMove, patch],
  )

  const onMessage = useCallback(
    (msg: ServerMessage) => {
      if (holding.current) queue.current.push(msg)
      else process(msg)
    },
    [process],
  )

  const { link, send } = useTransport(token, onMessage)

  useEffect(() => () => window.clearTimeout(holdTimer.current), [])

  // If the socket dropped while we were queued, the server forgot us: queue again.
  const wasSearching = useRef(false)
  useEffect(() => {
    if (link !== 'open') {
      wasSearching.current = sRef.current.phase === 'searching'
    } else if (wasSearching.current) {
      wasSearching.current = false
      send({ type: 'init_game' })
    }
  }, [link, send])

  const turn: Side = chessRef.current.turn() === 'w' ? 'white' : 'black'
  const myTurn = s.phase === 'playing' && s.color === turn
  const inCheck = chessRef.current.inCheck()

  const start = useCallback(() => {
    if (!send({ type: 'init_game' })) return patch({ error: 'Not connected yet. One moment…' })
    holding.current = true
    queue.current = []
    window.clearTimeout(holdTimer.current)
    holdTimer.current = window.setTimeout(() => {
      holding.current = false
      const q = queue.current
      queue.current = []
      q.forEach(process)
    }, MATCH_WAIT_MS)
    setSearchId((n) => n + 1)
    patch({ phase: 'searching', result: null, info: null, error: null, drawIncoming: null, drawSent: false })
  }, [send, patch, process])

  const move = useCallback(
    (from: Square, to: Square, promotion?: PieceSymbol) => {
      if (!(s.phase === 'playing' && s.color === turn)) return false
      const chess = chessRef.current
      const snapshot: Snapshot = { pieces: s.pieces, moves: s.moves, lastMove: s.lastMove }
      let m: Move
      try {
        m = chess.move({ from, to, ...(promotion ? { promotion } : {}) })
      } catch {
        patch({ error: 'Illegal move.' })
        return false
      }
      if (!send({ type: 'move', payload: { move: { from, to, ...(promotion ? { promotion } : {}) } } })) {
        chess.undo()
        patch({ error: 'Connection not ready. Try again in a moment.' })
        return false
      }
      pending.current = snapshot
      setS((cur) => ({ ...cur, pieces: applyMoveToPieces(cur.pieces, m), moves: [...cur.moves, m], lastMove: { from: m.from, to: m.to }, error: null, info: null }))
      play()
      return true
    },
    [s, turn, send, patch, play],
  )

  const resign = useCallback(() => {
    if (send({ type: 'resign' })) patch({ info: null, error: null, drawSent: false, drawIncoming: null })
  }, [send, patch])

  const offerDraw = useCallback(() => {
    if (send({ type: 'draw_request' })) patch({ drawSent: true, info: 'Draw offer sent.', error: null })
  }, [send, patch])

  const answerDraw = useCallback(
    (accepted: boolean) => {
      if (send({ type: 'draw_response', payload: { accepted } })) patch({ drawIncoming: null, info: accepted ? null : 'You declined the draw offer.' })
    },
    [send, patch],
  )

  const legalTargets = useCallback((sq: Square) => chessRef.current.moves({ square: sq, verbose: true }).map((m) => m.to), [])
  const pieceAt = useCallback((sq: Square) => chessRef.current.get(sq) ?? null, [])

  return {
    ...s,
    link: link as LinkState,
    searchId,
    turn,
    myTurn,
    inCheck,
    chess: chessRef.current,
    start,
    move,
    resign,
    offerDraw,
    answerDraw,
    legalTargets,
    pieceAt,
    soundOn,
    toggleSound,
    dismiss: () => patch({ error: null, info: null }),
  }
}
