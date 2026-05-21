import { getToken, setToken, getRefreshToken, refreshTokenApi, clearAuth } from './authService'

const API_BASE = '/api/profile'

function getHeaders() {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  }
}

async function fetchWithRetry(url, options) {
  let res = await fetch(url, options)
  
  if (res.status === 401) {
    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      clearAuth()
      window.location.reload()
      throw new Error('Not authenticated')
    }
    
    try {
      const data = await refreshTokenApi(refreshToken)
      setToken(data.access_token)
      options.headers['Authorization'] = `Bearer ${data.access_token}`
      res = await fetch(url, options)
    } catch {
      clearAuth()
      window.location.reload()
      throw new Error('Refresh failed')
    }
  }
  
  return res
}

async function fetchProfile() {
  const res = await fetchWithRetry(API_BASE, { headers: getHeaders() })
  const data = await res.json()
  return data.profile
}

async function updateProfile(profileData) {
  const res = await fetchWithRetry(API_BASE, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(profileData)
  })
  const data = await res.json()
  return data.profile
}

export { fetchProfile, updateProfile }
