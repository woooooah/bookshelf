import { auth } from './firebase.js'

// Naslov backenda; nastavi se v .env.local (VITE_API_URL)
export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export class ApiError extends Error {
  constructor(status, detail) {
    super(typeof detail === 'string' ? detail : `Error ${status}`)
    this.status = status
    this.detail = detail
  }
}

// Klic backenda; ce je uporabnik prijavljen, se doda Firebase zeton.
// body je objekt (poslje se kot JSON) ali FormData (nalaganje datotek).
export async function apiFetch(path, { method = 'GET', body } = {}) {
  const headers = {}
  const user = auth.currentUser
  if (user) {
    headers.Authorization = `Bearer ${await user.getIdToken()}`
  }
  const isForm = body instanceof FormData
  if (body !== undefined && !isForm) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body === undefined || isForm ? body : JSON.stringify(body),
  })

  const data = response.status === 204 ? null : await response.json().catch(() => null)
  if (!response.ok) {
    throw new ApiError(response.status, data?.detail)
  }
  return data
}

export const apiGet = (path) => apiFetch(path)
