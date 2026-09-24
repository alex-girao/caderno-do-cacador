// Tipos do domínio, independentes do Firebase.
// Instantes são milissegundos desde a época; a camada de persistência
// converte os Timestamps do Firestore antes de chamar o domínio.

export type Instante = number

export type Status = 'Aguardando' | 'Buscando' | 'Obtido' | 'Finalizado'

export interface Unidade {
  id: string
  itemId: string
  obtido: boolean
}

export interface Objetivo {
  id: string
  nome: string
  finalidadeId: string
  finalizado: boolean
  finalizadoEm: Instante | null
  itemIds: string[]
  unidades: Unidade[]
  criadoEm: Instante
  alteradoEm: Instante | null
}

/** Parte do objetivo que determina o status. */
export type EstadoObjetivo = Pick<Objetivo, 'finalizado' | 'unidades'>

/** Marca "agora": a persistência a substitui por serverTimestamp(). */
export const AGORA = 'agora'
export type Agora = typeof AGORA

export class ErroDeDominio extends Error {
  constructor(mensagem: string) {
    super(mensagem)
    this.name = 'ErroDeDominio'
  }
}
