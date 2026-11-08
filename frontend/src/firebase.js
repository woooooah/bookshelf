import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

// Spletna konfiguracija Firebase ni skrivnost (je v vsakem brskalniku),
// dostop varujeta Firebase in preverjanje zetona na backendu.
const firebaseConfig = {
  apiKey: 'AIzaSyDVb6-6WZmqwch4DKcyYVy02sg-b9FKI1U',
  authDomain: 'rirs-bookshelf.firebaseapp.com',
  projectId: 'rirs-bookshelf',
  storageBucket: 'rirs-bookshelf.firebasestorage.app',
  messagingSenderId: '582214925548',
  appId: '1:582214925548:web:f8d552be6f92ea9b7739c9',
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
