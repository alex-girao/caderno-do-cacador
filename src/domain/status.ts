import type { EstadoObjetivo, Status } from './tipos.ts'

/** Status derivado do objetivo (seção 6.1 da especificação). */
export function calcularStatus(objetivo: EstadoObjetivo): Status {
  if (objetivo.finalizado) return 'Finalizado'
  const total = objetivo.unidades.length
  if (total === 0) return 'Aguardando'
  const obtidas = contarObtidas(objetivo)
  if (obtidas === total) return 'Obtido'
  if (obtidas > 0) return 'Buscando'
  return 'Aguardando'
}

export function contarObtidas(objetivo: EstadoObjetivo): number {
  return objetivo.unidades.filter((u) => u.obtido).length
}

/** Objetivo esvaziado pela exclusão em cascata de um item (RN21). */
export function estaSemItens(objetivo: EstadoObjetivo): boolean {
  return objetivo.unidades.length === 0
}

export interface Resumo {
  status: Status
  obtidas: number
  total: number
  semItens: boolean
  /** Exibe o aviso "Sem itens": nunca em objetivos finalizados. */
  avisoSemItens: boolean
  /** Unidades podem ser marcadas e desmarcadas (RN14). */
  podeMarcar: boolean
  /** Exibe o botão "Finalizado" (RN11). */
  podeFinalizar: boolean
  /** Exibe o botão "Reverter" (RN13). */
  podeReverter: boolean
}

export function resumirObjetivo(objetivo: EstadoObjetivo): Resumo {
  const status = calcularStatus(objetivo)
  const semItens = estaSemItens(objetivo)
  return {
    status,
    obtidas: contarObtidas(objetivo),
    total: objetivo.unidades.length,
    semItens,
    avisoSemItens: semItens && !objetivo.finalizado,
    podeMarcar: !objetivo.finalizado,
    podeFinalizar: status === 'Obtido',
    podeReverter: status === 'Finalizado',
  }
}
