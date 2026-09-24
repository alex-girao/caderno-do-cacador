import { useEffect, useState } from 'react'
import type { Unsubscribe } from 'firebase/firestore'
import { useUid } from '../app/SessaoContext.tsx'
import type { AoFalhar, AoReceber } from './assinatura.ts'

export type EstadoLista<T> =
  | { estado: 'carregando' }
  | { estado: 'pronta'; registros: T[] }
  | { estado: 'erro'; erro: Error }

type Assinar<T> = (uid: string, aoReceber: AoReceber<T>, aoFalhar: AoFalhar) => Unsubscribe

/** Mantém a lista de uma coleção do usuário logado atualizada em tempo real. */
export function useAssinatura<T>(assinar: Assinar<T>): EstadoLista<T> {
  const uid = useUid()
  const [lista, setLista] = useState<EstadoLista<T>>({ estado: 'carregando' })

  useEffect(
    () =>
      assinar(
        uid,
        (registros) => setLista({ estado: 'pronta', registros }),
        (erro) => setLista({ estado: 'erro', erro }),
      ),
    [assinar, uid],
  )

  return lista
}

const NENHUM: never[] = []

/** Registros da lista pronta, ou uma lista vazia estável enquanto carrega ou falha. */
export function registrosDe<T>(lista: EstadoLista<T>): T[] {
  return lista.estado === 'pronta' ? lista.registros : NENHUM
}
