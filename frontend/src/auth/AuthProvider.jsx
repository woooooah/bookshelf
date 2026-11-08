import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { useEffect, useRef, useState } from 'react'
import { ApiError, apiFetch } from '../api.js'
import { auth } from '../firebase.js'
import { AuthContext } from './AuthContext.js'

// firebaseUser: prijava v Firebase; profile: uporabnik v nasi bazi (null = se ni izbral imena)
export default function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  // Prepreci, da starejsi odgovor /users/me prepise novejse stanje
  const requestId = useRef(0)

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      const id = ++requestId.current
      setFirebaseUser(user)
      if (!user) {
        setProfile(null)
        setLoading(false)
        return
      }
      setLoading(true)
      let me = null
      try {
        me = await apiFetch('/users/me')
      } catch (error) {
        // 403 not_registered: v Firebase je, v nasi bazi se ne
        if (!(error instanceof ApiError && error.detail === 'not_registered')) {
          console.error(error)
        }
      }
      if (id === requestId.current) {
        setProfile(me)
        setLoading(false)
      }
    })
  }, [])

  async function login(email, password) {
    await signInWithEmailAndPassword(auth, email, password)
  }

  // Ce je uporabnik ze prijavljen (npr. prejsnji poskus z zasedenim imenom), izbere samo ime
  async function register(email, password, username) {
    if (!auth.currentUser) {
      await createUserWithEmailAndPassword(auth, email, password)
    }
    const me = await apiFetch('/users/me', { method: 'POST', body: { username } })
    requestId.current++
    setProfile(me)
    setLoading(false)
  }

  async function logout() {
    await signOut(auth)
  }

  const value = { firebaseUser, profile, loading, login, register, logout }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
