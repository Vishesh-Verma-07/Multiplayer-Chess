import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ minHeight: '100svh', display: 'grid', placeContent: 'center', justifyItems: 'center', gap: 18 }}>
      <p className="mono">404 · Page not found</p>
      <Link className="btn btn-primary" href="/">
        Back home
      </Link>
    </div>
  )
}
