import axios from 'axios'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  timeout: 100000,
})

http.interceptors.response.use(
  response => response,
  error => Promise.reject(error),
)
