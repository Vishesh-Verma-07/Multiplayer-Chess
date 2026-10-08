import type { Move } from 'chess.js'

export interface MoveRow {
  n: number
  w: string
  b: string
}

/**
 * Groups moves into numbered rows using each move's real move number, so games that
 * start from a FEN (resumed players, spectators joining mid-game) are numbered correctly.
 */
export function buildMoveRows(moves: Move[]): MoveRow[] {
  const rows: MoveRow[] = []
  for (const m of moves) {
    const n = Number(m.before.split(' ')[5]) || rows.length + 1
    if (m.color === 'w') rows.push({ n, w: m.san, b: '' })
    else if (rows.length && rows[rows.length - 1].n === n && !rows[rows.length - 1].b) rows[rows.length - 1].b = m.san
    else rows.push({ n, w: '…', b: m.san })
  }
  return rows
}
