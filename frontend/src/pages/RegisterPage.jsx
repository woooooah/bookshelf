import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.js'
import { authErrorMessage } from '../auth/errors.js'
import FormField from '../components/FormField.jsx'

export default function RegisterPage() {
  const { firebaseUser, profile, loading, register, logout } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (loading) return <p className="text-stone-500">Nalagam...</p>
  if (profile) return <Navigate to={location.state?.from?.pathname ?? '/'} replace />

  // Prijavljen v Firebase, a brez uporabniskega imena: manjka samo se ime
  const onlyUsername = Boolean(firebaseUser)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await register(email, password, username.trim())
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-sm space-y-6">
      <h1 className="text-2xl font-bold">
        {onlyUsername ? 'Izberi uporabnisko ime' : 'Registracija'}
      </h1>
      {onlyUsername && (
        <p className="text-sm text-stone-600">
          Prijavljen si kot {firebaseUser.email}. Za dokoncanje registracije izberi uporabnisko
          ime.
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        {!onlyUsername && (
          <>
            <FormField
              label="E-naslov"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <FormField
              label="Geslo (vsaj 6 znakov)"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </>
        )}
        <FormField
          label="Uporabnisko ime"
          autoComplete="username"
          required
          minLength={3}
          maxLength={30}
          pattern="[A-Za-z0-9._\-]+"
          title="Crke, stevke, pika, podcrtaj ali vezaj"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-amber-700 px-4 py-2 font-medium text-white hover:bg-amber-800 disabled:opacity-50"
        >
          {submitting ? 'Shranjujem...' : 'Ustvari racun'}
        </button>
      </form>
      {onlyUsername ? (
        <button onClick={logout} className="text-sm text-stone-600 underline">
          Odjava
        </button>
      ) : (
        <p className="text-sm text-stone-600">
          Ze imas racun?{' '}
          <Link to="/login" state={location.state} className="text-amber-700 underline">
            Prijava
          </Link>
        </p>
      )}
    </section>
  )
}
