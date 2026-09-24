import { Timestamp } from 'firebase/firestore'
import type { DocumentData, DocumentSnapshot } from 'firebase/firestore'
import type { Instante } from '../domain/tipos.ts'

/**
 * Lê os dados do documento estimando os serverTimestamp() ainda pendentes,
 * para que um registro recém-criado já tenha criadoEm e possa ser ordenado.
 */
export function lerDados(snapshot: DocumentSnapshot): DocumentData {
  return snapshot.data({ serverTimestamps: 'estimate' }) ?? {}
}

export function paraInstante(valor: unknown): Instante | null {
  return valor instanceof Timestamp ? valor.toMillis() : null
}

export function paraTexto(valor: unknown): string {
  return typeof valor === 'string' ? valor : ''
}

/** Campos de registro comuns a todas as coleções (RN16, RN17). */
export function lerRegistro(snapshot: DocumentSnapshot, dados: DocumentData) {
  return {
    id: snapshot.id,
    criadoEm: paraInstante(dados.criadoEm) ?? 0,
    alteradoEm: paraInstante(dados.alteradoEm),
  }
}
