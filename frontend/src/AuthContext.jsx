import { createContext, useState, useEffect, useContext } from 'react'
import { 
  getMe, getToken, setToken, removeToken,
  getRefreshToken, setRefreshToken, removeRefreshToken, clearAuth,
  refreshTokenApi, login as loginApi, register as registerApi
} from './authService'

const AuthContext = createContext(null)

async function tryRefresh() {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return null
  
  try {
    const data = await refreshTokenApi(refreshToken)
    setToken(data.access_token)
    return await getMe(data.access_token)
  } catch {
    clearAuth()
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (token) {
      getMe(token)
        .then(userData => setUser(userData))
        .catch(async () => {
          const userData = await tryRefresh()
          if (userData) setUser(userData)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (username, password, rememberMe = false) => {
    const data = await loginApi(username, password, rememberMe)
    setToken(data.access_token)
    if (data.refresh_token) {
      setRefreshToken(data.refresh_token)
    }
    const userData = await getMe(data.access_token)
    setUser(userData)
    return userData
  }

  const register = async (username, email, password) => {
    const userData = await registerApi(username, email, password)
    const loginData = await loginApi(username, password, true)
    setToken(loginData.access_token)
    if (loginData.refresh_token) {
      setRefreshToken(loginData.refresh_token)
    }
    setUser(userData)
    return userData
  }

  const logout = () => {
    clearAuth()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
