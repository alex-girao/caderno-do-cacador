import { useCallback, useEffect, useState } from 'react'

export type Tema = 'pergaminho' | 'fogueira'

const CHAVE = 'caderno-do-cacador:tema'

function temaSalvo(): Tema {
  try {
    return localStorage.getItem(CHAVE) === 'fogueira' ? 'fogueira' : 'pergaminho'
  } catch {
    return 'pergaminho'
  }
}

/** Tema atual, aplicado em <html data-theme> e lembrado neste navegador. */
export function useTema() {
  const [tema, setTema] = useState<Tema>(temaSalvo)

  useEffect(() => {
    document.documentElement.dataset.theme = tema
    try {
      localStorage.setItem(CHAVE, tema)
    } catch {
      // Sem armazenamento local: o tema vale só nesta visita.
    }
  }, [tema])

  const alternar = useCallback(
    () => setTema((atual) => (atual === 'pergaminho' ? 'fogueira' : 'pergaminho')),
    [],
  )

  return { tema, alternar }
}
