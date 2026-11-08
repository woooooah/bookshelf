// Naslov backenda; nastavi se v .env.local (VITE_API_URL)
export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export async function apiGet(path) {
  const response = await fetch(`${API_URL}${path}`)
  if (!response.ok) {
    throw new Error(`Zahteva ${path} ni uspela (${response.status})`)
  }
  return response.json()
}
