import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext.js'

// Strani znotraj te poti so dostopne samo prijavljenim uporabnikom
export default function RequireAuth() {
  const { firebaseUser, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <p className="text-stone-500">Nalagam...</p>
  }
  if (!firebaseUser) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  if (!profile) {
    return <Navigate to="/register" replace state={{ from: location }} />
  }
  return <Outlet />
}
