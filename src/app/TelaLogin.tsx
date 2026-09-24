import { useState } from 'react'
import { entrarComGoogle } from '../firebase/auth.ts'
import { Botao } from '../ui/Botao.tsx'
import estilos from './TelaLogin.module.css'

export function TelaLogin() {
  const [entrando, setEntrando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function entrar() {
    setErro(null)
    setEntrando(true)
    try {
      await entrarComGoogle()
    } catch {
      setErro('Não foi possível entrar com a conta Google. Tente de novo.')
      setEntrando(false)
    }
  }

  return (
    <main className={estilos.tela}>
      <h1 className="t-marca">Caderno do Caçador</h1>
      <p className="t-corpo">Anote o que falta caçar para cada objetivo e marque cada peça obtida.</p>
      <Botao variante="primario" onClick={entrar} disabled={entrando}>
        Entrar com Google
      </Botao>
      {erro && (
        <p className="t-detalhe" role="alert">
          {erro}
        </p>
      )}
    </main>
  )
}
