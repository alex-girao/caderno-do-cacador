import { createContext, useContext } from 'react'
import type { User } from 'firebase/auth'

export const SessaoContext = createContext<User | null>(null)

/** Usuário autenticado. Só pode ser usado dentro da casca, após o login. */
export function useUsuario(): User {
  const usuario = useContext(SessaoContext)
  if (!usuario) throw new Error('useUsuario usado fora de uma sessão autenticada.')
  return usuario
}

export function useUid(): string {
  return useUsuario().uid
}
