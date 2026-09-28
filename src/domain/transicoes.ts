// Transições do objetivo (seção 6.2). Cada função valida a regra e
// devolve só os campos a gravar. A persistência grava o patch numa
// transação, sempre junto de alteradoEm = serverTimestamp() (RN18).

import { calcularStatus } from './status.ts'
import { AGORA, ErroDeDominio } from './tipos.ts'
import type { Agora, EstadoObjetivo, Unidade } from './tipos.ts'

export interface PatchUnidades {
  unidades: Unidade[]
  itemIds: string[]
}

export interface PatchFinalizacao {
  finalizado: boolean
  finalizadoEm: Agora | null
}

export type GeradorDeId = () => string

const gerarIdPadrao: GeradorDeId = () => crypto.randomUUID()

/** Ids distintos dos itens presentes nas unidades, na ordem em que aparecem (seção 12.4). */
export function calcularItemIds(unidades: readonly Unidade[]): string[] {
  return [...new Set(unidades.map((u) => u.itemId))]
}

/** Gera uma unidade não obtida por quantidade (RN06). */
export function criarUnidades(
  itemId: string,
  quantidade: number,
  gerarId: GeradorDeId = gerarIdPadrao,
): Unidade[] {
  if (!Number.isInteger(quantidade) || quantidade < 1) {
    throw new ErroDeDominio('A quantidade deve ser um número inteiro maior que zero.')
  }
  return Array.from({ length: quantidade }, () => ({ id: gerarId(), itemId, obtido: false }))
}

export interface ItemEscolhido {
  itemId: string
  quantidade: number
}

export interface DadosNovoObjetivo extends PatchUnidades, PatchFinalizacao {}

/** Unidades e estado inicial de um objetivo novo: nasce Aguardando (RN07, RN09). */
export function montarNovoObjetivo(
  itens: readonly ItemEscolhido[],
  gerarId: GeradorDeId = gerarIdPadrao,
): DadosNovoObjetivo {
  const unidades = itens.flatMap((i) => criarUnidades(i.itemId, i.quantidade, gerarId))
  if (unidades.length === 0) {
    throw new ErroDeDominio('Todo objetivo precisa de pelo menos um item.')
  }
  return { unidades, itemIds: calcularItemIds(unidades), finalizado: false, finalizadoEm: null }
}

/**
 * Define se a unidade foi obtida, só fora de objetivos finalizados
 * (RN10, RN11, RN14). Recebe o valor desejado, e não uma inversão, para
 * que cliques repetidos e transações reexecutadas não se anulem.
 */
export function marcarUnidade(objetivo: EstadoObjetivo, unidadeId: string, obtido: boolean): PatchUnidades {
  if (objetivo.finalizado) {
    throw new ErroDeDominio('Objetivo finalizado. Reverta antes de alterar as unidades.')
  }
  if (!objetivo.unidades.some((u) => u.id === unidadeId)) {
    throw new ErroDeDominio('Unidade não encontrada no objetivo.')
  }
  const unidades = objetivo.unidades.map((u) => (u.id === unidadeId ? { ...u, obtido } : u))
  return { unidades, itemIds: calcularItemIds(unidades) }
}

/** Marca ou desmarca uma unidade, invertendo o estado atual (RN14). */
export function alternarUnidade(objetivo: EstadoObjetivo, unidadeId: string): PatchUnidades {
  const atual = objetivo.unidades.find((u) => u.id === unidadeId)
  return marcarUnidade(objetivo, unidadeId, !atual?.obtido)
}

/** Finalizado: só a partir de Obtido, o que exclui objetivos sem itens (RN11, RN12). */
export function finalizar(objetivo: EstadoObjetivo): PatchFinalizacao {
  if (calcularStatus(objetivo) !== 'Obtido') {
    throw new ErroDeDominio('Só um objetivo com todas as unidades obtidas pode ser finalizado.')
  }
  return { finalizado: true, finalizadoEm: AGORA }
}

/** Reverter: devolve um objetivo finalizado para Obtido (RN13). */
export function reverter(objetivo: EstadoObjetivo): PatchFinalizacao {
  if (!objetivo.finalizado) {
    throw new ErroDeDominio('Só um objetivo finalizado pode ser revertido.')
  }
  return { finalizado: false, finalizadoEm: null }
}

export type PatchAdicao = PatchUnidades & Partial<PatchFinalizacao>

/**
 * Acrescenta unidades ao objetivo. Se alguma nova unidade não estiver obtida
 * e o objetivo estiver finalizado, limpa finalizado e finalizadoEm na mesma
 * escrita, e o objetivo volta a Buscando (RN15).
 */
export function adicionarUnidades(
  objetivo: EstadoObjetivo,
  novas: readonly Unidade[],
): PatchAdicao {
  const unidades = [...objetivo.unidades, ...novas]
  const patch: PatchAdicao = { unidades, itemIds: calcularItemIds(unidades) }
  if (objetivo.finalizado && novas.some((u) => !u.obtido)) {
    patch.finalizado = false
    patch.finalizadoEm = null
  }
  return patch
}
