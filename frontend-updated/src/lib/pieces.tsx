import type { PieceSymbol, Color } from 'chess.js'

/**
 * Staunton-inspired piece set on a 45×45 grid. Each piece is a stack of simple forms
 * (head, collar, body, plinth) so the silhouettes stay readable at small sizes.
 */
const PLINTH = (
  <>
    <path d="M14 33.6h17v2H14z" />
    <path d="M11.2 38.6v-2.1c0-1.1.9-2 2-2h18.6c1.1 0 2 .9 2 2v2.1z" />
  </>
)

const SHAPES: Record<PieceSymbol, React.ReactNode> = {
  p: (
    <>
      <path d="M18.6 19.6c-.5 5-2.7 8.6-4.3 14h16.4c-1.600-5.400-3.800-9-4.300-14z" />
      <path d="M17.200 18.100h10.600l-.700 2.100H17.900z" />
      <circle cx="22.500" cy="12.600" r="4.700" />
      {PLINTH}
    </>
  ),
  r: (
    <>
      <path d="M16.200 19.800h12.600l.9 13.800H15.300z" />
      <path d="M14.500 16.700h16l-1.300 3.100H15.800z" />
      <path d="M13.200 9.800h4.100v2.700h2.600V9.800h5.200v2.700h2.600V9.800h4.100v6.900H13.200z" />
      {PLINTH}
    </>
  ),
  n: (
    <>
      <path d="M13.800 33.600c.2-7.300 2.800-11.600 7.400-14.700-2.300.1-4.100 1.100-5.300 2.800l-3.200-1.600c1.100-4.700 4.700-8.500 9.400-9.800l1.300-3.100 2.300 2.800c6.100 1.400 10.200 7 10.100 14.300-.1 3.300-.6 6.400-1.100 9.300z" />
      <path d="M13.200 21.700l-.9 3.200 3.100-.2 2.400-3.500z" />
      {PLINTH}
    </>
  ),
  b: (
    <>
      <path d="M22.500 9.400c-4.500 3.100-6.600 6.400-6.600 9.600 0 2.500 1.400 4.300 3.400 5.300h6.400c2-1 3.400-2.800 3.400-5.300 0-3.200-2.100-6.500-6.600-9.600z" />
      <path d="M17 24.300h11v2.100H17z" />
      <path d="M19.300 26.400c-.4 3-2.500 5.100-4.200 7.200h15.800c-1.700-2.100-3.800-4.200-4.200-7.200z" />
      <circle cx="22.500" cy="7.300" r="2.100" />
      {PLINTH}
    </>
  ),
  q: (
    <>
      <path d="M10.500 13.200L15 26h15l4.500-12.800-3 7.300-3-9-3 9.200-3-10.200-3 10.200-3-9.200z" />
      <path d="M14.600 26h15.800l.9 2.300H13.700z" />
      <path d="M14.200 28.300h16.600l1.800 5.300H12.400z" />
      <circle cx="10.500" cy="11.700" r="2" />
      <circle cx="16.500" cy="9.800" r="2" />
      <circle cx="22.500" cy="8.800" r="2" />
      <circle cx="28.500" cy="9.800" r="2" />
      <circle cx="34.500" cy="11.700" r="2" />
      {PLINTH}
    </>
  ),
  k: (
    <>
      <path d="M22.500 13.200c-6 0-10.200 3.700-10.200 8.900 0 3.200 1.400 5.300 3.300 6.700h13.800c1.900-1.400 3.300-3.500 3.300-6.700 0-5.200-4.200-8.900-10.200-8.900z" />
      <path d="M14.200 28.800h16.600l.9 2.400H13.300z" />
      <path d="M13.600 31.200h17.800l1.200 2.400H12.400z" />
      <rect x="21" y="3.600" width="3" height="9.600" rx="1" />
      <rect x="17.600" y="6.200" width="9.800" height="3" rx="1" />
      {PLINTH}
    </>
  ),
}

export function PieceGlyph({ type, color }: { type: PieceSymbol; color: Color }) {
  const white = color === 'w'
  const g = white ? 'pg-w' : 'pg-b'
  return (
    <svg viewBox="0 0 45 45" aria-hidden="true" focusable="false" className={`piece-svg ${white ? 'is-w' : 'is-b'}`}>
      <defs>
        <linearGradient id="pg-w" x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0" stopColor="#fffdf7" />
          <stop offset="0.55" stopColor="#ebe5d6" />
          <stop offset="1" stopColor="#c9c1ad" />
        </linearGradient>
        <linearGradient id="pg-b" x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0" stopColor="#4a4b4f" />
          <stop offset="0.5" stopColor="#25262a" />
          <stop offset="1" stopColor="#0e0f11" />
        </linearGradient>
      </defs>
      <g fill={`url(#${g})`} stroke={white ? '#26231d' : '#050506'} strokeWidth="1.15" strokeLinejoin="round" strokeLinecap="round">
        {SHAPES[type]}
      </g>
      {type === 'b' && <path d="M24.800 13.600l-4.200 6.200" fill="none" stroke={white ? '#26231d' : '#8d8f95'} strokeWidth="1.2" strokeLinecap="round" />}
      {type === 'n' && <circle cx="21.200" cy="13.500" r="1.100" fill={white ? '#26231d' : '#d8d4c8'} />}
    </svg>
  )
}

export const PIECE_NAMES: Record<PieceSymbol, string> = {
  p: 'pawn',
  r: 'rook',
  n: 'knight',
  b: 'bishop',
  q: 'queen',
  k: 'king',
}
