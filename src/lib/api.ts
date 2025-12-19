import axios from 'axios'

// API client
export const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Token'ı her istekte ekle
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 401 hatalarında login'e yönlendir
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  me: () => api.get('/auth/me'),
  
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  register: (data: { name: string; email: string; password: string; org_name: string }) =>
    api.post('/auth/register', data),
  
  socialLogin: (data: { provider: string; provider_id: string; email: string; name?: string; avatar_url?: string }) =>
    api.post('/auth/social-login', data),
  
  logout: () => api.post('/auth/logout'),
}

// API Keys API
export const apiKeysAPI = {
  list: () => api.get('/keys'),
  
  create: (data: { name: string; app_type: string; auth_type: string }) =>
    api.post('/keys', data),
  
  revoke: (id: number) => api.delete(`/keys/${id}`),
}
