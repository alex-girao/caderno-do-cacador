import type { Status } from '../../domain/tipos.ts'

const COR: Record<Status, string> = {
  Aguardando: 'var(--status-aguardando)',
  Buscando: 'var(--status-buscando)',
  Obtido: 'var(--status-obtido)',
  Finalizado: 'var(--status-finalizado)',
}

/** Tinta de carimbo de cada status (tokens status-*). */
export const corDoStatus = (status: Status) => COR[status]
