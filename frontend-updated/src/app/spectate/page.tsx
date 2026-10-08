import type { Metadata } from 'next'
import { MotionRoot } from '@/components/MotionRoot'
import { SpectateList } from '@/components/spectate/SpectateList'
import '@/components/auth/AuthPage.css'
import '@/components/game/Game.css'

export const metadata: Metadata = { title: 'Live matches | Tempo' }

export default function Page() {
  return (
    <MotionRoot>
      <SpectateList />
    </MotionRoot>
  )
}
