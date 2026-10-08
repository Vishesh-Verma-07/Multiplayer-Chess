import type { Metadata } from 'next'
import { MotionRoot } from '@/components/MotionRoot'
import { GamePage } from '@/components/game/GamePage'

export const metadata: Metadata = { title: 'Play | Tempo', robots: { index: false } }

export default function Page() {
  return (
    <MotionRoot>
      <GamePage />
    </MotionRoot>
  )
}
