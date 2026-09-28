import type { ReactNode } from 'react'
import estilos from './CabecalhoTela.module.css'

interface Props {
  titulo: string
  detalhe?: string
  /** Ação principal da tela, como "Nova origem". */
  acao?: ReactNode
}

export function CabecalhoTela({ titulo, detalhe, acao }: Props) {
  return (
    <div className={estilos.cabecalho}>
      <div className={estilos.titulo}>
        <h1 className="t-secao">{titulo}</h1>
        {detalhe && <span className="t-detalhe">{detalhe}</span>}
      </div>
      {acao}
    </div>
  )
}
