import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import type { Unsubscribe, User } from 'firebase/auth'
import { auth } from './app.ts'

const provedorGoogle = new GoogleAuthProvider()
provedorGoogle.setCustomParameters({ prompt: 'select_account' })

export async function entrarComGoogle(): Promise<User> {
  const credencial = await signInWithPopup(auth, provedorGoogle)
  return credencial.user
}

export function sair(): Promise<void> {
  return signOut(auth)
}

/** Chama o callback com o usuário atual, ou null, a cada mudança de sessão. */
export function observarUsuario(callback: (usuario: User | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, callback)
}
