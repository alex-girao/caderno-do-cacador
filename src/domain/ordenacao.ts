import { calcularStatus } from './status.ts'
import type { Instante, Objetivo, Status } from './tipos.ts'

/** Ordem dos grupos da lista (RN23). */
export const ORDEM_STATUS: readonly Status[] = ['Buscando', 'Obtido', 'Aguardando', 'Finalizado']

export type ObjetivoOrdenavel = Pick<
  Objetivo,
  'id' | 'finalizado' | 'unidades' | 'criadoEm' | 'alteradoEm'
>

/** alteradoEm, ou criadoEm quando alteradoEm está vazio (RN24). */
export function instanteDeReferencia(objetivo: ObjetivoOrdenavel): Instante {
  return objetivo.alteradoEm ?? objetivo.criadoEm
}

/**
 * Por status (RN23) e, dentro do status, do mais recente para o mais antigo (RN24).
 * Empates de instante são desfeitos pelo id, para a ordem não oscilar na tela.
 */
export function compararObjetivos(a: ObjetivoOrdenavel, b: ObjetivoOrdenavel): number {
  const porStatus = ORDEM_STATUS.indexOf(calcularStatus(a)) - ORDEM_STATUS.indexOf(calcularStatus(b))
  if (porStatus !== 0) return porStatus
  const porInstante = instanteDeReferencia(b) - instanteDeReferencia(a)
  if (porInstante !== 0) return porInstante
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
}

/** Devolve uma nova lista ordenada, sem alterar a original. */
export function ordenarObjetivos<T extends ObjetivoOrdenavel>(objetivos: readonly T[]): T[] {
  return [...objetivos].sort(compararObjetivos)
}

export interface Grupo<T> {
  status: Status
  objetivos: T[]
}

/** Os quatro grupos na ordem da RN23, cada um já ordenado pela RN24. Grupos podem vir vazios. */
export function agruparPorStatus<T extends ObjetivoOrdenavel>(objetivos: readonly T[]): Grupo<T>[] {
  const ordenados = ordenarObjetivos(objetivos)
  return ORDEM_STATUS.map((status) => ({
    status,
    objetivos: ordenados.filter((o) => calcularStatus(o) === status),
  }))
}
