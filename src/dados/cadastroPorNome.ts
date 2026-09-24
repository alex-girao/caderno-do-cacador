import { addDoc, deleteDoc, serverTimestamp, updateDoc } from 'firebase/firestore'
import type { DocumentSnapshot } from 'firebase/firestore'
import { assinarConsulta, type AoFalhar, type AoReceber } from './assinatura.ts'
import { colecaoDoUsuario, documentoDoUsuario } from './caminhos.ts'
import { lerDados, lerRegistro, paraTexto } from './conversao.ts'

export interface RegistroPorNome {
  id: string
  nome: string
  criadoEm: number
  alteradoEm: number | null
}

/**
 * Operações comuns a coleções cujo único campo é o nome: origens e finalidades.
 * buscarUsos devolve os nomes de quem usa o registro, que bloqueiam a exclusão (RN22).
 */
export function criarCadastroPorNome(
  colecao: 'origens' | 'finalidades',
  buscarUsos: (uid: string, id: string) => Promise<string[]>,
) {
  const converter = (snapshot: DocumentSnapshot): RegistroPorNome => {
    const dados = lerDados(snapshot)
    return { ...lerRegistro(snapshot, dados), nome: paraTexto(dados.nome) }
  }

  return {
    assinar(uid: string, aoReceber: AoReceber<RegistroPorNome>, aoFalhar: AoFalhar) {
      return assinarConsulta(colecaoDoUsuario(uid, colecao), converter, aoReceber, aoFalhar)
    },

    async criar(uid: string, nome: string): Promise<string> {
      const ref = await addDoc(colecaoDoUsuario(uid, colecao), {
        nome,
        criadoEm: serverTimestamp(),
        alteradoEm: null,
      })
      return ref.id
    },

    renomear(uid: string, id: string, nome: string): Promise<void> {
      return updateDoc(documentoDoUsuario(uid, colecao, id), {
        nome,
        alteradoEm: serverTimestamp(),
      })
    },

    buscarUsos,

    /** Exclui sem verificar uso: a tela chama buscarUsos antes. */
    excluir(uid: string, id: string): Promise<void> {
      return deleteDoc(documentoDoUsuario(uid, colecao, id))
    },
  }
}

export type CadastroPorNome = ReturnType<typeof criarCadastroPorNome>
