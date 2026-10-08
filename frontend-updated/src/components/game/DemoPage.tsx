'use client'

import { useRouter } from 'next/navigation'
import { useDemoSocket } from '../../lib/useDemoSocket'
import { GameScreen } from './GameScreen'
import './Game.css'

const GUEST = { username: 'You' }

/** /game: the full game screen running against a simulated server and opponent. No login required. */
export function DemoPage() {
  const router = useRouter()
  return <GameScreen token={null} user={GUEST} onSignOut={() => router.push('/')} transport={useDemoSocket} demo />
}
