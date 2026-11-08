import { useParams } from 'react-router-dom'

// Podrobnosti knjige in izbira izdaje (US-04, wireframe 6 in 7)
export default function BookPage() {
  const { id } = useParams()

  return (
    <section>
      <h1 className="text-2xl font-bold">Knjiga #{id}</h1>
    </section>
  )
}
