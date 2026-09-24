import type { ReactNode } from 'react'
import { quantificar } from '../../domain/texto.ts'
import type { Status } from '../../domain/tipos.ts'
import { corDoStatus } from './corDoStatus.ts'
import estilos from './GrupoStatus.module.css'

interface Props {
  status: Status
  quantidade: number
  children: ReactNode
}

export function GrupoStatus({ status, quantidade, children }: Props) {
  return (
    <section className={estilos.grupo} aria-label={status}>
      <div className={estilos.cabecalho}>
        <h2 className="t-secao" style={{ color: corDoStatus(status) }}>
          {status}
        </h2>
        <span className="t-detalhe">{quantificar(quantidade, 'objetivo', 'objetivos')}</span>
      </div>
      <div className={estilos.grade}>{children}</div>
    </section>
  )
}
