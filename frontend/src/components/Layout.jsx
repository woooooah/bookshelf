import { Outlet } from 'react-router-dom'
import Header from './Header.jsx'

export default function Layout() {
  return (
    <div className="min-h-screen bg-cream text-ink">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
