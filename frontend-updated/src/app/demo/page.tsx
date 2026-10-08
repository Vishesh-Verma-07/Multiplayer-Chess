import type { Metadata } from 'next'
import { MotionRoot } from '@/components/MotionRoot'
import { DemoPage } from '@/components/game/DemoPage'

export const metadata: Metadata = { title: 'Demo match | Circle to Square', robots: { index: false } }

export default function Page() {
  return (
    <MotionRoot>
      <DemoPage />
    </MotionRoot>
  )
}
