import { useEffect, useState } from 'react'
import { apiGet } from '../api.js'

export default function HomePage() {
  const [status, setStatus] = useState({ backend: 'preverjam...', database: 'preverjam...' })

  // Preveri, ali frontend doseze backend in bazo
  useEffect(() => {
    apiGet('/health')
      .then(() => setStatus((s) => ({ ...s, backend: 'deluje' })))
      .catch(() => setStatus((s) => ({ ...s, backend: 'ni dosegljiv' })))
    apiGet('/health/db')
      .then(() => setStatus((s) => ({ ...s, database: 'povezana' })))
      .catch(() => setStatus((s) => ({ ...s, database: 'ni dosegljiva' })))
  }, [])

  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold">Dobrodosli v BookShelf</h1>
      <p className="text-stone-600">
        Spremljaj branje in vodi evidenco svoje domace knjiznice.
      </p>
      <ul className="text-sm text-stone-500">
        <li>Backend: {status.backend}</li>
        <li>Baza: {status.database}</li>
      </ul>
    </section>
  )
}
