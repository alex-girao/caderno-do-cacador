import { useRef } from 'react'
import { ErroDeDominio } from '../domain/tipos.ts'
import { useConfirmacao } from './confirmacaoContexto.ts'

/** Resultado da verificação feita antes de excluir. */
export type Verificacao =
  | { bloqueada: true; titulo: string; mensagem: string }
  | { bloqueada: false; titulo: string; mensagem: string; excluir: () => Promise<void> }

const FALHA = 'Não foi possível excluir. Verifique a conexão e tente de novo.'

/**
 * Fluxo de exclusão comum aos cadastros: verifica o uso, avisa se estiver
 * bloqueada, pede confirmação e só então exclui. Ignora cliques enquanto
 * uma exclusão está em andamento, sem desabilitar o botão, para que ele
 * receba o foco de volta quando o modal fechar.
 */
export function useExclusao() {
  const { confirmar, avisar } = useConfirmacao()
  const emAndamento = useRef(false)

  async function excluir(verificar: () => Promise<Verificacao>) {
    if (emAndamento.current) return
    emAndamento.current = true
    try {
      const verificacao = await verificar()
      if (verificacao.bloqueada) {
        await avisar(verificacao)
        return
      }
      const confirmado = await confirmar({ ...verificacao, rotuloConfirmar: 'Excluir' })
      if (confirmado) await verificacao.excluir()
    } catch (erro) {
      await avisar({
        titulo: 'Exclusão não concluída',
        mensagem: erro instanceof ErroDeDominio ? erro.message : FALHA,
      })
    } finally {
      emAndamento.current = false
    }
  }

  return excluir
}
