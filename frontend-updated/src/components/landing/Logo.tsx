'use client'

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="#151719" stroke="rgba(244,241,234,.15)" />
      <rect x="6" y="6" width="10" height="10" fill="#F4F1EA" />
      <rect x="16" y="16" width="10" height="10" fill="#F4F1EA" />
      <rect x="16" y="6" width="10" height="10" fill="#2a2b2e" />
      <rect x="6" y="16" width="10" height="10" fill="#2a2b2e" />
      <circle cx="21" cy="11" r="3" fill="#C9A96E" />
    </svg>
  )
}
