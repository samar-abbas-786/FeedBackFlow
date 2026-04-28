import axios from 'axios'

const envBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
const normalizedBaseUrl = envBaseUrl
  ? envBaseUrl.replace(/\/$/, '')
  : import.meta.env.PROD
    ? 'https://feedbackflowserver.onrender.com/api'
    : '/api'

const api = axios.create({
  baseURL: normalizedBaseUrl,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('ff_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ff_token')
      localStorage.removeItem('ff_user')
      window.location.href = '/'
    }
    return Promise.reject(err)
  }
)

export default api
