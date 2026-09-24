import { addDoc, runTransaction, serverTimestamp, updateDoc } from 'firebase/firestore'
import type { DocumentSnapshot } from 'firebase/firestore'
import { calcularImpactoExclusaoItem, removerItemDoObjetivo, type ImpactoExclusaoItem } from '../domain/exclusao.ts'
import { ErroDeDominio, type Item } from '../domain/tipos.ts'
import { db } from '../firebase/app.ts'
import { assinarConsulta, type AoFalhar, type AoReceber } from './assinatura.ts'
import { colecaoDoUsuario, documentoDoUsuario } from './caminhos.ts'
import { lerDados, lerRegistro, paraTexto } from './conversao.ts'
import { converterObjetivo, objetivos } from './objetivos.ts'

export type DadosItem = Pick<Item, 'nome' | 'origemId'>

export interface PreviaExclusaoItem {
  impacto: ImpactoExclusaoItem
  /** Objetivos a atualizar na cascata. */
  objetivoIds: string[]
}

/** Limite de escritas por transação do Firestore. */
const LIMITE_ESCRITAS = 500

function converter(snapshot: DocumentSnapshot): Item {
  const dados = lerDados(snapshot)
  return {
    ...lerRegistro(snapshot, dados),
    nome: paraTexto(dados.nome),
    origemId: paraTexto(dados.origemId),
  }
}

export const itens = {
  assinar(uid: string, aoReceber: AoReceber<Item>, aoFalhar: AoFalhar) {
    return assinarConsulta(colecaoDoUsuario(uid, 'itens'), converter, aoReceber, aoFalhar)
  },

  async criar(uid: string, { nome, origemId }: DadosItem): Promise<string> {
    const ref = await addDoc(colecaoDoUsuario(uid, 'itens'), {
      nome,
      origemId,
      criadoEm: serverTimestamp(),
      alteradoEm: null,
    })
    return ref.id
  },

  editar(uid: string, id: string, { nome, origemId }: DadosItem): Promise<void> {
    return updateDoc(documentoDoUsuario(uid, 'itens', id), {
      nome,
      origemId,
      alteradoEm: serverTimestamp(),
    })
  },
  /** Objetivos afetados pela exclusão do item, para a confirmação (RN21). */
  async preverExclusao(uid: string, itemId: string): Promise<PreviaExclusaoItem> {
    const afetados = await objetivos.buscarPorItem(uid, itemId)
    return {
      impacto: calcularImpactoExclusaoItem(afetados, itemId),
      objetivoIds: afetados.map((o) => o.id),
    }
  },

  /**
   * Exclui o item e remove suas unidades dos objetivos numa única transação
   * (RN21). Cada objetivo é relido dentro da transação, para que a remoção
   * parta do estado atual e não sobrescreva marcações feitas em outro
   * dispositivo. O SDK web não faz consultas em transações, então os
   * objetivos vêm da prévia.
   */
  async excluirEmCascata(uid: string, itemId: string, objetivoIds: readonly string[]): Promise<void> {
    if (objetivoIds.length + 1 > LIMITE_ESCRITAS) {
      throw new ErroDeDominio('O item está em objetivos demais para ser excluído de uma vez.')
    }
    await runTransaction(db, async (transacao) => {
      const referencias = objetivoIds.map((id) => documentoDoUsuario(uid, 'objetivos', id))
      const snapshots = await Promise.all(referencias.map((ref) => transacao.get(ref)))
      for (const snapshot of snapshots) {
        if (!snapshot.exists()) continue
        const patch = removerItemDoObjetivo(converterObjetivo(snapshot), itemId)
        if (patch) transacao.update(snapshot.ref, { ...patch, alteradoEm: serverTimestamp() })
      }
      transacao.delete(documentoDoUsuario(uid, 'itens', itemId))
    })
  },
}
