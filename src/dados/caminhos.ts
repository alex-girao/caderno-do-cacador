import { collection, doc } from 'firebase/firestore'
import type { CollectionReference, DocumentReference } from 'firebase/firestore'
import { db } from '../firebase/app.ts'

export type NomeColecao = 'finalidades' | 'origens' | 'itens' | 'objetivos'

/** users/{uid}/{colecao}: todo dado do usuário fica sob o seu uid (RN26). */
export function colecaoDoUsuario(uid: string, colecao: NomeColecao): CollectionReference {
  return collection(db, 'users', uid, colecao)
}

export function documentoDoUsuario(uid: string, colecao: NomeColecao, id: string): DocumentReference {
  return doc(db, 'users', uid, colecao, id)
}
