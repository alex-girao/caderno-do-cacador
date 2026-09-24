// Regras de exclusão dos cadastros (seção 8).

import { quantificar } from './texto.ts'
import type { EstadoObjetivo } from './tipos.ts'
import { calcularItemIds, type PatchUnidades } from './transicoes.ts'

/**
 * Remove do objetivo todas as unidades do item excluído do catálogo (RN21),
 * recalculando itemIds. Não toca em finalizado: excluir um item não desfaz
 * uma conquista. Devolve null se o objetivo não usa o item.
 */
export function removerItemDoObjetivo(objetivo: EstadoObjetivo, itemId: string): PatchUnidades | null {
  const unidades = objetivo.unidades.filter((u) => u.itemId !== itemId)
  if (unidades.length === objetivo.unidades.length) return null
  return { unidades, itemIds: calcularItemIds(unidades) }
}

export interface ImpactoExclusaoItem {
  /** Objetivos que perdem unidades. */
  objetivos: number
  /** Unidades removidas no total. */
  unidades: number
  /** Objetivos que ficam sem nenhuma unidade. */
  esvaziados: number
}

export function calcularImpactoExclusaoItem(
  objetivos: readonly EstadoObjetivo[],
  itemId: string,
): ImpactoExclusaoItem {
  const impacto = { objetivos: 0, unidades: 0, esvaziados: 0 }
  for (const objetivo of objetivos) {
    const removidas = objetivo.unidades.filter((u) => u.itemId === itemId).length
    if (removidas === 0) continue
    impacto.objetivos++
    impacto.unidades += removidas
    if (removidas === objetivo.unidades.length) impacto.esvaziados++
  }
  return impacto
}

/** Texto da confirmação de exclusão de um item (RN21). */
export function textoConfirmacaoExclusaoItem(nomeItem: string, impacto: ImpactoExclusaoItem): string {
  if (impacto.objetivos === 0) {
    return `Excluir ${nomeItem}? O item não está em nenhum objetivo.`
  }
  const unidades = quantificar(impacto.unidades, 'unidade', 'unidades')
  const objetivos = quantificar(impacto.objetivos, 'objetivo', 'objetivos')
  let texto = `Excluir ${nomeItem} também remove ${unidades} em ${objetivos}.`
  if (impacto.esvaziados > 0) {
    const verbo = impacto.esvaziados === 1 ? 'ficará' : 'ficarão'
    texto += ` ${quantificar(impacto.esvaziados, 'objetivo', 'objetivos')} ${verbo} sem itens.`
  }
  return texto
}

/** "A", "A e B", "A, B e C". Acima do limite, "A, B e mais 3". */
export function listarNomes(nomes: readonly string[], limite = 5): string {
  if (nomes.length > limite) {
    return `${nomes.slice(0, limite).join(', ')} e mais ${nomes.length - limite}`
  }
  if (nomes.length <= 1) return nomes.join('')
  return `${nomes.slice(0, -1).join(', ')} e ${nomes.at(-1)}`
}

const USOS = {
  origem: { singular: 'item', plural: 'itens', campo: 'a origem', desse: 'desse item', desses: 'desses itens' },
  finalidade: {
    singular: 'objetivo',
    plural: 'objetivos',
    campo: 'a finalidade',
    desse: 'desse objetivo',
    desses: 'desses objetivos',
  },
} as const

/** Aviso de exclusão bloqueada de Origem ou Finalidade em uso (RN22). */
export function textoExclusaoBloqueada(
  tipo: 'origem' | 'finalidade',
  nome: string,
  usadoPor: readonly string[],
): string {
  const u = USOS[tipo]
  const quantos = quantificar(usadoPor.length, u.singular, u.plural)
  const quem = usadoPor.length === 1 ? u.desse : u.desses
  return `${nome} está em uso por ${quantos}: ${listarNomes(usadoPor)}. Altere ${u.campo} ${quem} antes de excluí-la.`
}

/** Confirmação da exclusão de um objetivo junto com suas unidades (RN19). */
export function textoConfirmacaoExclusaoObjetivo(nome: string, unidades: number): string {
  const junto = unidades === 0 ? '' : unidades === 1 ? ' e sua unidade' : ` e suas ${unidades} unidades`
  return `Excluir ${nome}${junto}? Esta ação não pode ser desfeita.`
}
