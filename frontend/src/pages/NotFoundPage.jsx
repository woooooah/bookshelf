import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-bold">Stran ne obstaja</h1>
      <Link to="/" className="text-amber-700 underline">
        Nazaj na zacetek
      </Link>
    </section>
  )
}
