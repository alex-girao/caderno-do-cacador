import { getDocs, query, where } from 'firebase/firestore'
import type { DocumentSnapshot } from 'firebase/firestore'
import type { Objetivo, Unidade } from '../domain/tipos.ts'
import { assinarConsulta, type AoFalhar, type AoReceber } from './assinatura.ts'
import { colecaoDoUsuario } from './caminhos.ts'
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

async function buscarOnde(uid: string, campo: string, operador: '==' | 'array-contains', valor: string) {
  const resultado = await getDocs(query(colecaoDoUsuario(uid, 'objetivos'), where(campo, operador, valor)))
  return resultado.docs.map(converterObjetivo)
}

export const objetivos = {
  /** Coleção inteira em tempo real; status e ordem são calculados no cliente (seção 12.6). */
  assinar(uid: string, aoReceber: AoReceber<Objetivo>, aoFalhar: AoFalhar) {
    return assinarConsulta(colecaoDoUsuario(uid, 'objetivos'), converterObjetivo, aoReceber, aoFalhar)
  },

  /** Objetivos com a finalidade (RN22, seção 12.5). */
  buscarPorFinalidade: (uid: string, finalidadeId: string) =>
    buscarOnde(uid, 'finalidadeId', '==', finalidadeId),

  /** Objetivos com unidades do item, pelo campo desnormalizado itemIds (RN21, seção 12.5). */
  buscarPorItem: (uid: string, itemId: string) => buscarOnde(uid, 'itemIds', 'array-contains', itemId),
}
