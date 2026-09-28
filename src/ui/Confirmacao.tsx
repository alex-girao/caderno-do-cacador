import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { ConfirmacaoContext, type PedidoAviso, type PedidoConfirmacao } from './confirmacaoContexto.ts'
import { Botao } from './Botao.tsx'
import { Modal } from './Modal.tsx'

type Aberto =
  | { tipo: 'confirmar'; pedido: PedidoConfirmacao; responder: (sim: boolean) => void }
  | { tipo: 'avisar'; pedido: PedidoAviso; responder: () => void }

/** Um único modal de confirmação e aviso para toda a aplicação. */
export function ProvedorConfirmacao({ children }: { children: ReactNode }) {
  const [aberto, setAberto] = useState<Aberto | null>(null)

  const confirmar = useCallback(
    (pedido: PedidoConfirmacao) =>
      new Promise<boolean>((resolver) => {
        setAberto({
          tipo: 'confirmar',
          pedido,
          responder: (sim) => {
            setAberto(null)
            resolver(sim)
          },
        })
      }),
    [],
  )

  const avisar = useCallback(
    (pedido: PedidoAviso) =>
      new Promise<void>((resolver) => {
        setAberto({
          tipo: 'avisar',
          pedido,
          responder: () => {
            setAberto(null)
            resolver()
          },
        })
      }),
    [],
  )

  const valor = useMemo(() => ({ confirmar, avisar }), [confirmar, avisar])

  return (
    <ConfirmacaoContext.Provider value={valor}>
      {children}
      {aberto?.tipo === 'confirmar' && (
        <Modal
          papel="alertdialog"
          titulo={aberto.pedido.titulo}
          aoFechar={() => aberto.responder(false)}
          rodape={
            <>
              <Botao onClick={() => aberto.responder(false)}>Cancelar</Botao>
              <Botao variante="primario" onClick={() => aberto.responder(true)}>
                {aberto.pedido.rotuloConfirmar}
              </Botao>
            </>
          }
        >
          <p className="t-corpo">{aberto.pedido.mensagem}</p>
        </Modal>
      )}
      {aberto?.tipo === 'avisar' && (
        <Modal
          papel="alertdialog"
          titulo={aberto.pedido.titulo}
          aoFechar={aberto.responder}
          rodape={<Botao onClick={aberto.responder}>Entendi</Botao>}
        >
          <p className="t-corpo">{aberto.pedido.mensagem}</p>
        </Modal>
      )}
    </ConfirmacaoContext.Provider>
  )
}
