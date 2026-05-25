// client/src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../api/client.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.me()
      .then(({ user }) => setUser(user))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function login(email, password) {
    const { user } = await api.login(email, password)
    setUser(user)
  }

  async function loginAs(username) {
    const { user } = await api.loginAs(username)
    setUser(user)
  }

  async function register(data) {
    const { user } = await api.register(data)
    setUser(user)
  }

  async function logout() {
    await api.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, loginAs, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
