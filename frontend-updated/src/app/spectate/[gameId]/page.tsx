import type { Metadata } from 'next'
import { MotionRoot } from '@/components/MotionRoot'
import { SpectateGame } from '@/components/spectate/SpectateGame'
import '@/components/auth/AuthPage.css'

export const metadata: Metadata = { title: 'Watching a live match | Tempo' }

export default async function Page({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params
  return (
    <MotionRoot>
      <SpectateGame gameId={gameId} />
    </MotionRoot>
  )
}
