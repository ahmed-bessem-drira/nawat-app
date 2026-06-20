import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const authService = {
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password })
    return response.data
  },

  async register(parentData) {
    const response = await api.post('/parents/register', parentData)
    return response.data
  },

  async getCurrentUser() {
    const response = await api.get('/parents/me')
    return response.data
  },

  async logout() {
    await api.post('/auth/logout')
  },
}
