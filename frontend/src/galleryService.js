import { getToken, setToken, getRefreshToken, refreshTokenApi, clearAuth } from './authService'

const API_BASE = '/api/gallery'

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

async function fetchGallery() {
  const res = await fetchWithRetry(API_BASE, { headers: getHeaders() })
  const data = await res.json()
  return data.images
}

async function addGalleryImage(imageData) {
  const res = await fetchWithRetry(API_BASE, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ image_data: imageData })
  })
  const data = await res.json()
  return data.image
}

async function deleteGalleryImage(id) {
  await fetchWithRetry(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  })
}

export { fetchGallery, addGalleryImage, deleteGalleryImage }
