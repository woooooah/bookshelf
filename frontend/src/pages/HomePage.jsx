import { useEffect, useState } from 'react'
import { apiGet } from '../api.js'

export default function HomePage() {
  const [status, setStatus] = useState({ backend: 'checking...', database: 'checking...' })

  // Preveri, ali frontend doseze backend in bazo
  useEffect(() => {
    apiGet('/health')
      .then(() => setStatus((s) => ({ ...s, backend: 'running' })))
      .catch(() => setStatus((s) => ({ ...s, backend: 'unreachable' })))
    apiGet('/health/db')
      .then(() => setStatus((s) => ({ ...s, database: 'connected' })))
      .catch(() => setStatus((s) => ({ ...s, database: 'unreachable' })))
  }, [])

  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold">Welcome to BookShelf</h1>
      <p className="text-muted">
        Track your reading and keep a record of your home library.
      </p>
      <ul className="text-sm text-muted">
        <li>Backend: {status.backend}</li>
        <li>Database: {status.database}</li>
      </ul>
    </section>
  )
}
