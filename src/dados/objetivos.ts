import { doc, getDocs, query, runTransaction, serverTimestamp, where } from 'firebase/firestore'
import type { DocumentSnapshot } from 'firebase/firestore'
import { aparaNome } from '../domain/cadastros.ts'
import { montarPatchEdicao, type FormularioObjetivo } from '../domain/edicaoObjetivo.ts'
import {
  finalizar,
  marcarUnidade,
  montarNovoObjetivo,
  reverter,
  type PatchFinalizacao,
  type PatchUnidades,
} from '../domain/transicoes.ts'
import { AGORA, ErroDeDominio, type Objetivo, type Unidade } from '../domain/tipos.ts'
import { db } from '../firebase/app.ts'
import { assinarConsulta, type AoFalhar, type AoReceber } from './assinatura.ts'
import { colecaoDoUsuario, documentoDoUsuario } from './caminhos.ts'
import { lerDados, lerRegistro, paraInstante, paraTexto } from './conversao.ts'

function paraUnidades(valor: unknown): Unidade[] {
  if (!Array.isArray(valor)) return []
  return valor.map((u) => ({ id: paraTexto(u?.id), itemId: paraTexto(u?.itemId), obtido: u?.obtido === true }))
}

export function converterObjetivo(snapshot: DocumentSnapshot): Objetivo {
  const dados = lerDados(snapshot)
  const unidades = paraUnidades(dados.unidades)
  return {
    ...lerRegistro(snapshot, dados),
    nome: paraTexto(dados.nome),
    finalidadeId: paraTexto(dados.finalidadeId),
    finalizado: dados.finalizado === true,
    finalizadoEm: paraInstante(dados.finalizadoEm),
    itemIds: Array.isArray(dados.itemIds) ? dados.itemIds.map(paraTexto) : [],
    unidades,
  }
}

type Patch = Partial<PatchUnidades & PatchFinalizacao & Pick<Objetivo, 'nome' | 'finalidadeId'>>

/** Troca a marca AGORA do domínio por serverTimestamp() (seção 12.7). */
export function paraGravacao(patch: Patch) {
  const { finalizadoEm, ...resto } = patch
  if (finalizadoEm === undefined) return resto
  return { ...resto, finalizadoEm: finalizadoEm === AGORA ? serverTimestamp() : null }
}

/**
 * Relê o objetivo numa transação, calcula o patch pelo domínio a partir do
 * estado atual e grava junto com alteradoEm (seção 12.3, RN18).
 */
function alterarEmTransacao(uid: string, id: string, calcular: (objetivo: Objetivo) => Patch) {
  return runTransaction(db, async (transacao) => {
    const ref = documentoDoUsuario(uid, 'objetivos', id)
    const snapshot = await transacao.get(ref)
    if (!snapshot.exists()) throw new ErroDeDominio('Este objetivo foi excluído.')
    const patch = calcular(converterObjetivo(snapshot))
    transacao.update(ref, { ...paraGravacao(patch), alteradoEm: serverTimestamp() })
  })
}

async function buscarOnde(uid: string, campo: string, operador: '==' | 'array-contains', valor: string) {
  const resultado = await getDocs(query(colecaoDoUsuario(uid, 'objetivos'), where(campo, operador, valor)))
  return resultado.docs.map(converterObjetivo)
}

export const objetivos = {
  /** Coleção inteira em tempo real; status e ordem são calculados no cliente (seção 12.6). */
  assinar(uid: string, aoReceber: AoReceber<Objetivo>, aoFalhar: AoFalhar) {
    return assinarConsulta(colecaoDoUsuario(uid, 'objetivos'), converterObjetivo, aoReceber, aoFalhar)
  },

  /** Cria o objetivo, que nasce Aguardando com uma unidade por quantidade (RN06, RN07, RN09). */
  async criar(uid: string, { nome, finalidadeId, linhas }: FormularioObjetivo): Promise<string> {
    const dados = montarNovoObjetivo(linhas)
    const ref = doc(colecaoDoUsuario(uid, 'objetivos'))
    await runTransaction(db, async (transacao) => {
      transacao.set(ref, {
        nome: aparaNome(nome),
        finalidadeId,
        ...paraGravacao(dados),
        criadoEm: serverTimestamp(),
        alteradoEm: null,
      })
    })
    return ref.id
  },

  /** Edita dados e itens; as unidades são reconciliadas sobre o estado relido (RN08, RN15, RN20). */
  editar: (uid: string, id: string, { nome, finalidadeId, linhas }: FormularioObjetivo) =>
    alterarEmTransacao(uid, id, (objetivo) => {
      const { unidades, itemIds, finalizado, finalizadoEm } = montarPatchEdicao(objetivo, linhas)
      const patch: Patch = { nome: aparaNome(nome), finalidadeId, unidades, itemIds }
      return finalizado === undefined ? patch : { ...patch, finalizado, finalizadoEm }
    }),

  marcarUnidade: (uid: string, id: string, unidadeId: string, obtido: boolean) =>
    alterarEmTransacao(uid, id, (o) => marcarUnidade(o, unidadeId, obtido)),

  finalizar: (uid: string, id: string) => alterarEmTransacao(uid, id, finalizar),

  reverter: (uid: string, id: string) => alterarEmTransacao(uid, id, reverter),

  /** Objetivos com a finalidade (RN22, seção 12.5). */
  buscarPorFinalidade: (uid: string, finalidadeId: string) =>
    buscarOnde(uid, 'finalidadeId', '==', finalidadeId),

  /** Objetivos com unidades do item, pelo campo desnormalizado itemIds (RN21, seção 12.5). */
  buscarPorItem: (uid: string, itemId: string) => buscarOnde(uid, 'itemIds', 'array-contains', itemId),
}
