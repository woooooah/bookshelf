import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.js'

// Header iz wireframa 1: logo, iskalno polje, My library, My reading
export default function Header() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const { firebaseUser, profile, loading, logout } = useAuth()

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  function handleSubmit(event) {
    event.preventDefault()
    const q = query.trim()
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`)
  }

  const linkClass = ({ isActive }) =>
    `whitespace-nowrap font-medium hover:text-accent ${
      isActive ? 'text-accent underline underline-offset-8' : ''
    }`

  return (
    <header className="border-b border-line-strong bg-header">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-4">
        <Link to="/" className="text-2xl font-bold tracking-tight">
          BookShelf
        </Link>

        <form onSubmit={handleSubmit} className="order-last w-full sm:order-none sm:w-auto sm:flex-1">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by title, author or ISBN"
            aria-label="Search books"
            className="w-full max-w-md rounded-md border border-line-strong px-3 py-2 focus:border-accent focus:outline-none"
          />
        </form>

        <nav className="ml-auto flex items-center gap-6">
          <NavLink to="/library" className={linkClass}>
            My library
          </NavLink>
          <NavLink to="/reading" className={linkClass}>
            My reading
          </NavLink>
          {!loading && firebaseUser && (
            <span className="flex items-center gap-3 text-sm">
              {profile && <span className="text-muted">{profile.username}</span>}
              <button onClick={handleLogout} className="hover:text-accent">
                Log out
              </button>
            </span>
          )}
          {!loading && !firebaseUser && (
            <NavLink to="/login" className={linkClass}>
              Log in
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  )
}
