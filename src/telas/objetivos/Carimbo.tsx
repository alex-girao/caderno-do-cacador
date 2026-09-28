import type { Status } from '../../domain/tipos.ts'
import estilos from './Carimbo.module.css'
import { corDoStatus } from './corDoStatus.ts'

/** Carimbo de borracha na margem: o status sempre escrito, nunca só a cor. */
export function Carimbo({ status }: { status: Status }) {
  return (
    <span className={`t-carimbo ${estilos.carimbo}`} style={{ color: corDoStatus(status) }}>
      {status}
    </span>
  )
}
