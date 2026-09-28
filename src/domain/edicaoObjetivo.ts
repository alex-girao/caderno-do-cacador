// Criação e edição de objetivos: das linhas do modal (item e quantidade)
// para as unidades gravadas (RN05 a RN08, RN15, RN20).

import { aparaNome } from './cadastros.ts'
import { listarNomes } from './exclusao.ts'
import { ErroDeDominio, type EstadoObjetivo, type Unidade } from './tipos.ts'
import {
  calcularItemIds,
  criarUnidades,
  type GeradorDeId,
  type PatchFinalizacao,
  type PatchUnidades,
} from './transicoes.ts'

/** Uma linha do modal: um item e quantas unidades dele o objetivo deve ter. */
export interface LinhaItem {
  itemId: string
  quantidade: number
}

export interface LinhaComProgresso extends LinhaItem {
  /** Unidades obtidas hoje, antes de qualquer alteração. */
  obtidas: number
}

/** Agrupa as unidades em linhas, na ordem em que cada item aparece pela primeira vez. */
export function linhasDoObjetivo(unidades: readonly Unidade[]): LinhaComProgresso[] {
  const linhas = new Map<string, LinhaComProgresso>()
  for (const u of unidades) {
    const linha = linhas.get(u.itemId) ?? { itemId: u.itemId, quantidade: 0, obtidas: 0 }
    linha.quantidade++
    if (u.obtido) linha.obtidas++
    linhas.set(u.itemId, linha)
  }
  return [...linhas.values()]
}

function validarLinhas(linhas: readonly LinhaItem[]) {
  const vistos = new Set<string>()
  for (const { itemId, quantidade } of linhas) {
    if (!Number.isInteger(quantidade) || quantidade < 1) {
      throw new ErroDeDominio('A quantidade deve ser um número inteiro maior que zero.')
    }
    if (vistos.has(itemId)) throw new ErroDeDominio('Um item aparece mais de uma vez no objetivo.')
    vistos.add(itemId)
  }
}

/**
 * Unidades que o objetivo passa a ter, a partir das atuais e das linhas desejadas.
 *
 * Para cada linha, com q desejadas e k atuais do item:
 * - q ≥ k: mantém as k e acrescenta q − k novas, não obtidas;
 * - q < k: remove k − q, primeiro as não obtidas e depois as obtidas (RN08),
 *   das últimas para as primeiras; as que ficam mantêm a ordem.
 * Itens ausentes das linhas perdem todas as unidades. O resultado segue a
 * ordem das linhas.
 */
export function reconciliarUnidades(
  atuais: readonly Unidade[],
  linhas: readonly LinhaItem[],
  gerarId?: GeradorDeId,
): Unidade[] {
  validarLinhas(linhas)
  return linhas.flatMap(({ itemId, quantidade }) => {
    const doItem = atuais.filter((u) => u.itemId === itemId)
    const excesso = doItem.length - quantidade
    if (excesso <= 0) {
      return excesso === 0 ? doItem : [...doItem, ...criarUnidades(itemId, -excesso, gerarId)]
    }
    const ordemDeRemocao = [...doItem.filter((u) => !u.obtido).reverse(), ...doItem.filter((u) => u.obtido).reverse()]
    const removidas = new Set(ordemDeRemocao.slice(0, excesso).map((u) => u.id))
    return doItem.filter((u) => !removidas.has(u.id))
  })
}

/** Quantas obtidas restam na linha com a nova quantidade, já que as pendentes saem primeiro. */
export function obtidasAposAjuste(obtidas: number, quantidade: number): number {
  return Math.min(obtidas, quantidade)
}

/** "nenhuma obtida", "1 obtida", "1 de 3 obtida", "2 de 3 obtidas"; avisa se obtidas serão removidas. */
export function textoObtidasDaLinha(linha: LinhaComProgresso): string {
  const restantes = obtidasAposAjuste(linha.obtidas, linha.quantidade)
  let texto: string
  if (restantes === 0) texto = 'nenhuma obtida'
  else if (linha.quantidade === 1) texto = '1 obtida'
  else texto = `${restantes} de ${linha.quantidade} ${restantes === 1 ? 'obtida' : 'obtidas'}`
  const perdidas = linha.obtidas - restantes
  if (perdidas > 0) texto += `; ${perdidas} ${perdidas === 1 ? 'obtida será removida' : 'obtidas serão removidas'}`
  return texto
}

export type PatchEdicao = PatchUnidades &
  Partial<PatchFinalizacao> & {
    /** Itens das unidades criadas nesta edição, a reler na transação. */
    itensNovos: string[]
  }

export const MENSAGEM_ULTIMA_UNIDADE =
  'O objetivo precisa de pelo menos um item. Para retirar o último, exclua o objetivo.'

/**
 * Patch das unidades de um objetivo existente, calculado sobre o estado
 * atual (relido na transação). Aplica a RN15 quando surgem unidades não
 * obtidas num objetivo finalizado, e a RN20: a edição não pode remover a
 * última unidade de um objetivo que tem unidades. Um objetivo já vazio
 * pode ser salvo vazio, por exemplo para ser renomeado.
 */
export function montarPatchEdicao(
  objetivo: EstadoObjetivo,
  linhas: readonly LinhaItem[],
  gerarId?: GeradorDeId,
): PatchEdicao {
  const unidades = reconciliarUnidades(objetivo.unidades, linhas, gerarId)
  if (objetivo.unidades.length > 0 && unidades.length === 0) {
    throw new ErroDeDominio(MENSAGEM_ULTIMA_UNIDADE)
  }
  const idsAtuais = new Set(objetivo.unidades.map((u) => u.id))
  const novas = unidades.filter((u) => !idsAtuais.has(u.id))
  const patch: PatchEdicao = { unidades, itemIds: calcularItemIds(unidades), itensNovos: calcularItemIds(novas) }
  if (objetivo.finalizado && novas.some((u) => !u.obtido)) {
    patch.finalizado = false
    patch.finalizadoEm = null
  }
  return patch
}

export interface FormularioObjetivo {
  nome: string
  finalidadeId: string
  linhas: LinhaItem[]
}

/**
 * Validação do modal antes de gravar. Na criação exige pelo menos um item
 * (RN04, RN07); na edição, só impede esvaziar um objetivo que tinha itens (RN20).
 */
export function validarFormularioObjetivo(
  formulario: FormularioObjetivo,
  contexto: { criando: boolean; tinhaUnidades: boolean; finalidadeExiste: boolean },
): string | null {
  if (!aparaNome(formulario.nome)) return 'Informe o nome.'
  if (!formulario.finalidadeId || !contexto.finalidadeExiste) return 'Escolha a finalidade.'
  if (formulario.linhas.length === 0) {
    if (contexto.criando) return 'Adicione pelo menos um item.'
    if (contexto.tinhaUnidades) return MENSAGEM_ULTIMA_UNIDADE
  }
  return null
}

/**
 * A transação encontrou referências que não existem mais: itens das
 * unidades novas ou a finalidade escolhida, excluídos durante a edição.
 */
export class ReferenciasInexistentes extends ErroDeDominio {
  readonly itemIds: string[]
  readonly finalidade: boolean

  constructor(itemIds: string[], finalidade: boolean) {
    super('Algum item ou a finalidade foi excluído enquanto você editava.')
    this.name = 'ReferenciasInexistentes'
    this.itemIds = itemIds
    this.finalidade = finalidade
  }
}

/** Mensagem ao usuário, com os nomes que ele conhecia dos itens excluídos. */
export function mensagemReferenciasInexistentes(
  erro: ReferenciasInexistentes,
  nomes: ReadonlyMap<string, string>,
): string {
  const partes: string[] = []
  if (erro.itemIds.length > 0) {
    const conhecidos = erro.itemIds.map((id) => nomes.get(id)).filter((n): n is string => !!n)
    const quem =
      conhecidos.length === erro.itemIds.length
        ? listarNomes(conhecidos)
        : erro.itemIds.length === 1
          ? 'Um item'
          : `${erro.itemIds.length} itens`
    partes.push(
      erro.itemIds.length === 1
        ? `${quem} foi excluído do catálogo enquanto você editava. Revise os itens e salve de novo.`
        : `${quem} foram excluídos do catálogo enquanto você editava. Revise os itens e salve de novo.`,
    )
  }
  if (erro.finalidade) {
    partes.push('A finalidade escolhida foi excluída enquanto você editava. Escolha outra e salve de novo.')
  }
  return partes.join(' ')
}
