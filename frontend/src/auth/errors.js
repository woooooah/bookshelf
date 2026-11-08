import { ApiError } from '../api.js'

const FIREBASE_MESSAGES = {
  'auth/invalid-credential': 'Napacen e-naslov ali geslo.',
  'auth/invalid-email': 'E-naslov ni veljaven.',
  'auth/email-already-in-use': 'Racun s tem e-naslovom ze obstaja.',
  'auth/weak-password': 'Geslo mora imeti vsaj 6 znakov.',
  'auth/too-many-requests': 'Prevec poskusov. Poskusi znova cez nekaj minut.',
  'auth/network-request-failed': 'Ni povezave z internetom.',
}

// Napako Firebase ali backenda pretvori v sporocilo za uporabnika
export function authErrorMessage(error) {
  if (error instanceof ApiError) {
    if (error.status === 422) {
      return 'Uporabnisko ime ima lahko 3–30 znakov: crke, stevke, pika, podcrtaj ali vezaj.'
    }
    return error.message
  }
  return FIREBASE_MESSAGES[error?.code] ?? 'Prislo je do napake. Poskusi znova.'
}
