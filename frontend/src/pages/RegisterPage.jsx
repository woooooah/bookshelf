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

  if (loading) return <p className="text-muted">Loading...</p>
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
        {onlyUsername ? 'Choose a username' : 'Sign up'}
      </h1>
      {onlyUsername && (
        <p className="text-sm text-muted">
          You are logged in as {firebaseUser.email}. Choose a username to finish signing up.
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        {!onlyUsername && (
          <>
            <FormField
              label="Email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <FormField
              label="Password (at least 6 characters)"
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
          label="Username"
          autoComplete="username"
          required
          minLength={3}
          maxLength={30}
          pattern="[A-Za-z0-9._\-]+"
          title="Letters, numbers, dots, underscores or hyphens"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-accent px-4 py-2 font-medium text-white hover:bg-accent-dark disabled:opacity-50"
        >
          {submitting ? 'Saving...' : 'Create account'}
        </button>
      </form>
      {onlyUsername ? (
        <button onClick={logout} className="text-sm text-muted underline">
          Log out
        </button>
      ) : (
        <p className="text-sm text-muted">
          Already have an account?{' '}
          <Link to="/login" state={location.state} className="text-accent underline">
            Log in
          </Link>
        </p>
      )}
    </section>
  )
}
