import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.js'
import { authErrorMessage } from '../auth/errors.js'
import FormField from '../components/FormField.jsx'

export default function LoginPage() {
  const { firebaseUser, profile, loading, login } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const from = location.state?.from?.pathname ?? '/'

  // Po prijavi: nazaj na stran, ki jo je uporabnik zelel odpreti
  if (!loading && profile) return <Navigate to={from} replace />
  if (!loading && firebaseUser) return <Navigate to="/register" replace state={location.state} />

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-sm space-y-6">
      <h1 className="text-2xl font-bold">Log in</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <FormField
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-amber-700 px-4 py-2 font-medium text-white hover:bg-amber-800 disabled:opacity-50"
        >
          {submitting ? 'Logging in...' : 'Log in'}
        </button>
      </form>
      <p className="text-sm text-stone-600">
        Don't have an account?{' '}
        <Link to="/register" state={location.state} className="text-amber-700 underline">
          Sign up
        </Link>
      </p>
    </section>
  )
}
