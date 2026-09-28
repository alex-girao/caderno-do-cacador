import { useEffect, useState } from 'react'

export const ROTAS = [
  { id: 'objetivos', nome: 'Objetivos' },
  { id: 'itens', nome: 'Itens' },
  { id: 'origens', nome: 'Origens' },
  { id: 'finalidades', nome: 'Finalidades' },
] as const

export type Rota = (typeof ROTAS)[number]['id']

function rotaDoHash(): Rota {
  const hash = window.location.hash.slice(1)
  return ROTAS.find((r) => r.id === hash)?.id ?? 'objetivos'
}

/** Seção atual, lida do hash da URL (#objetivos, #itens, #origens, #finalidades). */
export function useRota(): Rota {
  const [rota, setRota] = useState<Rota>(rotaDoHash)

  useEffect(() => {
    const aoMudar = () => setRota(rotaDoHash())
    window.addEventListener('hashchange', aoMudar)
    return () => window.removeEventListener('hashchange', aoMudar)
  }, [])

  return rota
}
