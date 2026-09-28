import { onSnapshot } from 'firebase/firestore'
import type { DocumentSnapshot, Query, Unsubscribe } from 'firebase/firestore'

export type AoReceber<T> = (registros: T[]) => void
export type AoFalhar = (erro: Error) => void

/** Assina uma consulta em tempo real, convertendo cada documento. */
export function assinarConsulta<T>(
  consulta: Query,
  converter: (snapshot: DocumentSnapshot) => T,
  aoReceber: AoReceber<T>,
  aoFalhar: AoFalhar,
): Unsubscribe {
  return onSnapshot(consulta, (resultado) => aoReceber(resultado.docs.map(converter)), aoFalhar)
}
