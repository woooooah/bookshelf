import { ApiError } from '../api.js'

const FIREBASE_MESSAGES = {
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/invalid-email': 'Invalid email address.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/too-many-requests': 'Too many attempts. Try again in a few minutes.',
  'auth/network-request-failed': 'No internet connection.',
}

// Napako Firebase ali backenda pretvori v sporocilo za uporabnika
export function authErrorMessage(error) {
  if (error instanceof ApiError) {
    if (error.status === 422) {
      return 'Username must be 3–30 characters: letters, numbers, dots, underscores or hyphens.'
    }
    return error.message
  }
  return FIREBASE_MESSAGES[error?.code] ?? 'Something went wrong. Please try again.'
}
