import { useSearchParams } from 'react-router-dom'

// Search results (US-01, wireframe 5)
export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''

  return (
    <section>
      <h1 className="text-2xl font-bold">Search results</h1>
      <p className="mt-2 text-stone-600">Results for "{query}"</p>
    </section>
  )
}
