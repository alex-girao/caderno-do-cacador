// Textos exibidos nos cartões de objetivo.

import type { Instante, Unidade } from './tipos.ts'

const MINUTO = 60_000
const HORA = 60 * MINUTO
const DIA = 24 * HORA

/** "agora mesmo", "há 5 min", "há 1 hora", "há 3 dias", "há 2 meses", "há 1 ano". */
export function tempoRelativo(instante: Instante, agora: Instante): string {
  const minutos = Math.round(Math.max(0, agora - instante) / MINUTO)
  if (minutos < 1) return 'agora mesmo'
  if (minutos < 60) return `há ${minutos} min`
  const horas = Math.round(minutos / 60)
  if (horas < 24) return horas === 1 ? 'há 1 hora' : `há ${horas} horas`
  const dias = Math.round((agora - instante) / DIA)
  if (dias < 30) return dias === 1 ? 'há 1 dia' : `há ${dias} dias`
  const meses = Math.floor(dias / 30)
  if (meses < 12) return meses === 1 ? 'há 1 mês' : `há ${meses} meses`
  const anos = Math.floor(dias / 365)
  return anos === 1 ? 'há 1 ano' : `há ${anos} anos`
}

/** "Bolsa, alterado há 2 horas", ou "criado há..." enquanto alteradoEm está vazio. */
export function metaDoObjetivo(
  finalidade: string,
  criadoEm: Instante,
  alteradoEm: Instante | null,
  agora: Instante,
): string {
  const quando =
    alteradoEm === null ? `criado ${tempoRelativo(criadoEm, agora)}` : `alterado ${tempoRelativo(alteradoEm, agora)}`
  return `${finalidade}, ${quando}`
}

/** "3 de 5 obtidas", "0 de 1 obtida". */
export function textoProgresso(obtidas: number, total: number): string {
  return `${obtidas} de ${total} ${total === 1 ? 'obtida' : 'obtidas'}`
}

export const ITEM_REMOVIDO = 'Item removido'

export interface ItemDoCatalogo {
  nome: string
  origem: string
}

export interface UnidadeAnotada {
  unidade: Unidade
  nome: string
  /** Origem e, se o item se repete, a posição: "Animal, 2 de 3". */
  anotacao: string
  /** O item da unidade não existe mais no catálogo. */
  removido: boolean
}

/** Nome e anotação de cada unidade do checklist, na ordem do objetivo. */
export function anotarUnidades(
  unidades: readonly Unidade[],
  catalogo: ReadonlyMap<string, ItemDoCatalogo>,
): UnidadeAnotada[] {
  const totais = new Map<string, number>()
  for (const u of unidades) totais.set(u.itemId, (totais.get(u.itemId) ?? 0) + 1)
  const posicoes = new Map<string, number>()

  return unidades.map((unidade) => {
    const posicao = (posicoes.get(unidade.itemId) ?? 0) + 1
    posicoes.set(unidade.itemId, posicao)
    const total = totais.get(unidade.itemId)!
    const sufixo = total > 1 ? `${posicao} de ${total}` : ''
    const item = catalogo.get(unidade.itemId)
    if (!item) return { unidade, nome: ITEM_REMOVIDO, anotacao: sufixo, removido: true }
    return {
      unidade,
      nome: item.nome,
      anotacao: sufixo ? `${item.origem}, ${sufixo}` : item.origem,
      removido: false,
    }
  })
}
