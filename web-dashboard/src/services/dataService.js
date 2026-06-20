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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const dataService = {
  async getChildren() {
    const response = await api.get('/parents/children')
    return response.data
  },

  async addChild(childData) {
    const response = await api.post('/parents/children', childData)
    return response.data
  },

  async getChildSessions(childId) {
    const response = await api.get(`/parents/children/${childId}/sessions`)
    return response.data
  },

  async getChildMoods(childId) {
    const response = await api.get(`/parents/children/${childId}/moods`)
    return response.data
  },

  async getChildRecommendations(childId) {
    const response = await api.get(`/parents/children/${childId}/recommendations`)
    return response.data
  },

  async generateChildCode(childId) {
    const response = await api.post(`/parents/children/${childId}/generate-code`)
    return response.data
  },

  async getChildAnalytics(childId) {
    const response = await api.get(`/parents/children/${childId}/analytics`)
    return response.data
  },
}
