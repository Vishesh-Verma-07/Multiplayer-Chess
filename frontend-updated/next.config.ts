import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Pin the workspace root so a lockfile higher up the tree isn't picked by mistake.
  turbopack: { root: process.cwd() },
}

export default nextConfig
