import { useEffect, useState } from 'react'

/** Instante atual, renovado a cada minuto, para textos como "há 5 min". */
export function useAgora(intervalo = 60_000): number {
  const [agora, setAgora] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setAgora(Date.now()), intervalo)
    return () => clearInterval(id)
  }, [intervalo])
  return agora
}
