import { MotionRoot } from '@/components/MotionRoot'
import { Navbar } from '@/components/landing/Navbar'
import { Hero } from '@/components/landing/Hero'
import { ProductSignals } from '@/components/landing/ProductSignals'
import { LiveSection } from '@/components/landing/LiveSection'
import { ArchitectureSection } from '@/components/landing/ArchitectureSection'
import { Features } from '@/components/landing/Features'
import { ReconnectDemo } from '@/components/landing/ReconnectDemo'
import { SpectatorSection } from '@/components/landing/SpectatorSection'
import { Technology } from '@/components/landing/Technology'
import { FinalCTA } from '@/components/landing/FinalCTA'
import { Footer } from '@/components/landing/Footer'
import '@/components/landing/Sections.css'

export default function LandingPage() {
  return (
    <MotionRoot>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <Navbar />
      <main id="main">
        <Hero />
        <ProductSignals />
        <LiveSection />
        <ArchitectureSection />
        <Features />
        <ReconnectDemo />
        <SpectatorSection />
        <Technology />
        <FinalCTA />
      </main>
      <Footer />
    </MotionRoot>
  )
}
