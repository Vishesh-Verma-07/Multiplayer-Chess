'use client'

import { MotionConfig } from 'motion/react'

/** Honours the visitor's reduced-motion preference for every animation below it. */
export function MotionRoot({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
