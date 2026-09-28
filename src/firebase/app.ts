import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { configuracaoFirebase } from './config.ts'

export const app = initializeApp(configuracaoFirebase)
export const auth = getAuth(app)
export const db = getFirestore(app)
