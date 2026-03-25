import axios from 'axios'

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001'

// Axios instance — auto-attaches userId header
const api = axios.create({ baseURL: API })
api.interceptors.request.use(cfg => {
  const id = localStorage.getItem('ss_user_id')
  if (id) cfg.headers['x-user-id'] = id
  return cfg
})

// ── Auth ──────────────────────────────────────────────
export function startCanvasOAuth() {
  const params = new URLSearchParams({
    client_id: process.env.REACT_APP_CANVAS_CLIENT_ID,
    response_type: 'code',
    redirect_uri: `${window.location.origin}/auth/callback`,
    scope: [
      'url:GET|/api/v1/courses',
      'url:GET|/api/v1/planner/items',
      'url:GET|/api/v1/announcements',
    ].join(' '),
  })
  window.location.href =
    `${process.env.REACT_APP_CANVAS_BASE_URL}/login/oauth2/auth?${params}`
}

export async function exchangeCode(code) {
  const { data } = await api.post('/auth/canvas/token', { code })
  localStorage.setItem('ss_user_id', data.userId)
  localStorage.setItem('ss_user_name', data.name)
  return data
}

export function getUserId()   { return localStorage.getItem('ss_user_id') }
export function getUserName() { return localStorage.getItem('ss_user_name') }
export function isConnected() { return !!getUserId() }

export function logout() {
  localStorage.removeItem('ss_user_id')
  localStorage.removeItem('ss_user_name')
  window.location.href = '/connect'
}

// ── Canvas data ───────────────────────────────────────
export const fetchCourses       = () => api.get('/api/courses').then(r => r.data)
export const fetchPlanner       = () => api.get('/api/planner').then(r => r.data)
export const fetchAnnouncements = () => api.get('/api/announcements').then(r => r.data)

// ── Schedule ──────────────────────────────────────────
export const fetchSchedule = () => api.get('/api/schedule').then(r => r.data)
export const syncSchedule  = () => api.post('/api/schedule/sync').then(r => r.data)

export const createSlot = (slot) =>
  api.post('/api/schedule', slot).then(r => r.data)

export const deleteSlot = (id) =>
  api.delete(`/api/schedule/${id}`).then(r => r.data)

// ── Tasks ─────────────────────────────────────────────
export const fetchTasks = () => api.get('/api/tasks').then(r => r.data)
export const syncTasks  = () => api.post('/api/tasks/sync').then(r => r.data)

export const createTask = (task) =>
  api.post('/api/tasks', task).then(r => r.data)

export const toggleTask = (id, completed) =>
  api.patch(`/api/tasks/${id}`, { completed }).then(r => r.data)

export const deleteTask = (id) =>
  api.delete(`/api/tasks/${id}`).then(r => r.data)
