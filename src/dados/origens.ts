import { getDocs, query, where } from 'firebase/firestore'
import { criarCadastroPorNome } from './cadastroPorNome.ts'
import { colecaoDoUsuario } from './caminhos.ts'
import { lerDados, paraTexto } from './conversao.ts'

/** Nomes dos itens com a origem (RN22, seção 12.5). */
async function buscarItensDaOrigem(uid: string, origemId: string): Promise<string[]> {
  const resultado = await getDocs(query(colecaoDoUsuario(uid, 'itens'), where('origemId', '==', origemId)))
  return resultado.docs.map((d) => paraTexto(lerDados(d).nome))
}

export const origens = criarCadastroPorNome('origens', buscarItensDaOrigem)
