import { createContext, useContext } from 'react'

export const AuthContext = createContext(null)

// Podatki o prijavi: { firebaseUser, profile, loading, login, register, logout }
export function useAuth() {
  return useContext(AuthContext)
}
