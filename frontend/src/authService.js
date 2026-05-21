const API_BASE = '/api/auth'

async function register(username, email, password) {
  const res = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.detail || 'Registration failed')
  }
  return res.json()
}

async function login(username, password, rememberMe = false) {
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, remember_me: rememberMe })
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.detail || 'Login failed')
  }
  return res.json()
}

async function refreshTokenApi(refreshToken) {
  const res = await fetch(`${API_BASE}/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken })
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.detail || 'Refresh failed')
  }
  return res.json()
}

async function getMe(token) {
  const res = await fetch(`${API_BASE}/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!res.ok) {
    throw new Error('Not authenticated')
  }
  return res.json()
}

function getToken() {
  return localStorage.getItem('token')
}

function setToken(token) {
  localStorage.setItem('token', token)
}

function removeToken() {
  localStorage.removeItem('token')
}

function getRefreshToken() {
  return localStorage.getItem('refresh_token')
}

function setRefreshToken(token) {
  localStorage.setItem('refresh_token', token)
}

function removeRefreshToken() {
  localStorage.removeItem('refresh_token')
}

function clearAuth() {
  removeToken()
  removeRefreshToken()
}

export { 
  register, login, getMe, refreshTokenApi,
  getToken, setToken, removeToken,
  getRefreshToken, setRefreshToken, removeRefreshToken,
  clearAuth
}
