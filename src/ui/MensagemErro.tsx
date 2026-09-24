import type { ReactNode } from 'react'

/** Mensagem de erro anunciada por leitores de tela. Não renderiza nada se vazia. */
export function MensagemErro({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="t-detalhe" style={{ color: 'var(--sangue)' }} hidden={!children}>
      {children}
    </p>
  )
}
