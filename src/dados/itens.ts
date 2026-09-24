import { addDoc, serverTimestamp, updateDoc } from 'firebase/firestore'
import type { DocumentSnapshot } from 'firebase/firestore'
import type { Item } from '../domain/tipos.ts'
import { assinarConsulta, type AoFalhar, type AoReceber } from './assinatura.ts'
import { colecaoDoUsuario, documentoDoUsuario } from './caminhos.ts'
import { lerDados, lerRegistro, paraTexto } from './conversao.ts'

export type DadosItem = Pick<Item, 'nome' | 'origemId'>

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
}
