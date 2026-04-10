import { createContext, useContext, useState, useCallback } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sdra_user')) } catch { return null }
  })
  const [token, setToken] = useState(() => localStorage.getItem('sdra_token'))

  const login = useCallback(async (username, password) => {
    const res = await api.post('/auth/login', { username, password })
    const { token, user } = res.data
    localStorage.setItem('sdra_token', token)
    localStorage.setItem('sdra_user', JSON.stringify(user))
    setToken(token)
    setUser(user)
    return user
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('sdra_token')
    localStorage.removeItem('sdra_user')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
