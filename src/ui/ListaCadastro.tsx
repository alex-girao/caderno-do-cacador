import type { ReactNode } from 'react'
import type { EstadoLista } from '../dados/useAssinatura.ts'
import estilos from './ListaCadastro.module.css'

export interface LinhaCadastro {
  id: string
  nome: string
  /** Anotação de margem, como a origem de um item. */
  detalhe?: string
}

interface Props<T> {
  lista: EstadoLista<T>
  /** Converte os registros, já ordenados, em linhas. */
  linhas: (registros: T[]) => LinhaCadastro[]
  vazio: string
  acoes: (linha: LinhaCadastro) => ReactNode
}

/** Lista pautada de um cadastro, com os estados de carregamento, erro e vazio. */
export function ListaCadastro<T>({ lista, linhas, vazio, acoes }: Props<T>) {
  if (lista.estado === 'carregando') return <p className="t-detalhe">Abrindo o caderno.</p>
  if (lista.estado === 'erro') {
    return (
      <p className="t-detalhe" role="alert">
        Não foi possível carregar a lista. Verifique a conexão e recarregue a página.
      </p>
    )
  }
  const itens = linhas(lista.registros)
  if (itens.length === 0) return <p className="t-corpo">{vazio}</p>

  return (
    <ul className={estilos.lista}>
      {itens.map((linha) => (
        <li key={linha.id} className={estilos.linha}>
          <span className={estilos.nome}>
            <span className="t-corpo">{linha.nome}</span>
            {linha.detalhe && <span className="t-detalhe">{linha.detalhe}</span>}
          </span>
          <span className={estilos.acoes}>{acoes(linha)}</span>
        </li>
      ))}
    </ul>
  )
}
