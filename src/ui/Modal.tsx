import { useEffect, useEffectEvent, useId, useRef, type ReactNode } from 'react'
import estilos from './Modal.module.css'

interface Props {
  titulo: string
  aoFechar: () => void
  children: ReactNode
  /** Botões de ação, alinhados ao fim. */
  rodape?: ReactNode
  /** Papel ARIA: "alertdialog" para confirmações e avisos. */
  papel?: 'dialog' | 'alertdialog'
}

/**
 * Modal sobre <dialog> nativo: prende o foco, fecha com Esc e devolve o
 * foco a quem o abriu. É montado aberto; para fechar, desmonte-o.
 */
export function Modal({ titulo, aoFechar, children, rodape, papel = 'dialog' }: Props) {
  const dialogo = useRef<HTMLDialogElement>(null)
  const idTitulo = useId()
  const cancelar = useEffectEvent(aoFechar)

  useEffect(() => {
    const elemento = dialogo.current!
    const focoAnterior = document.activeElement as HTMLElement | null
    elemento.showModal()

    // Esc dispara "cancel": quem decide fechar é o componente pai.
    const aoCancelar = (evento: Event) => {
      evento.preventDefault()
      cancelar()
    }
    elemento.addEventListener('cancel', aoCancelar)

    return () => {
      elemento.removeEventListener('cancel', aoCancelar)
      elemento.close()
      if (focoAnterior?.isConnected) focoAnterior.focus()
    }
  }, [])

  return (
    <dialog ref={dialogo} className={estilos.modal} aria-labelledby={idTitulo} role={papel}>
      <div className={estilos.cabecalho}>
        <h2 id={idTitulo} className="t-secao">
          {titulo}
        </h2>
        <button type="button" className={estilos.fechar} aria-label="Fechar" onClick={aoFechar}>
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path
              d="M4 4l10 10M14 4L4 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
      <div className={estilos.corpo}>{children}</div>
      {rodape && <div className={estilos.rodape}>{rodape}</div>}
    </dialog>
  )
}
