import type { Metadata } from 'next'
import { MotionRoot } from '@/components/MotionRoot'
import { AuthPage } from '@/components/auth/AuthPage'

export const metadata: Metadata = { title: 'Sign in | Tempo', robots: { index: false } }

export default function Page() {
  return (
    <MotionRoot>
      <AuthPage />
    </MotionRoot>
  )
}
