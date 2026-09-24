import { createContext, useContext } from 'react'

export interface PedidoConfirmacao {
  titulo: string
  mensagem: string
  /** Rótulo da ação confirmada, como "Excluir". */
  rotuloConfirmar: string
}

export interface PedidoAviso {
  titulo: string
  mensagem: string
}

export interface Confirmacao {
  /** Pergunta ao usuário; resolve true só se ele confirmar. */
  confirmar: (pedido: PedidoConfirmacao) => Promise<boolean>
  /** Informa algo que só pode ser lido e fechado, como uma exclusão bloqueada. */
  avisar: (pedido: PedidoAviso) => Promise<void>
}

export const ConfirmacaoContext = createContext<Confirmacao | null>(null)

export function useConfirmacao(): Confirmacao {
  const contexto = useContext(ConfirmacaoContext)
  if (!contexto) throw new Error('useConfirmacao usado fora do ProvedorConfirmacao.')
  return contexto
}
