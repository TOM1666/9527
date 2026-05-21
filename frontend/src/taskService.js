import { getToken, setToken, getRefreshToken, refreshTokenApi, clearAuth } from './authService'

const API_BASE = '/api/tasks'

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

async function fetchTasks() {
  const res = await fetchWithRetry(API_BASE, { headers: getHeaders() })
  const data = await res.json()
  return data.tasks
}

async function createTask(text, priority) {
  const res = await fetchWithRetry(API_BASE, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ text, priority })
  })
  const data = await res.json()
  return data.task
}

async function updateTask(id, completed) {
  const res = await fetchWithRetry(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ completed })
  })
  const data = await res.json()
  return data.task
}

async function deleteTask(id) {
  await fetchWithRetry(`${API_BASE}/${id}`, { 
    method: 'DELETE',
    headers: getHeaders()
  })
}

export { fetchTasks, createTask, updateTask, deleteTask }
