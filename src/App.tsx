import { useEffect, useState } from 'react'
import type { User } from 'firebase/auth'
import { entrarComGoogle, observarUsuario, sair } from './firebase/auth.ts'

type Sessao = { estado: 'carregando' } | { estado: 'pronta'; usuario: User | null }

export default function App() {
  const [sessao, setSessao] = useState<Sessao>({ estado: 'carregando' })
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => observarUsuario((usuario) => setSessao({ estado: 'pronta', usuario })), [])

  async function entrar() {
    setErro(null)
    try {
      await entrarComGoogle()
    } catch {
      setErro('Não foi possível entrar com a conta Google. Tente de novo.')
    }
  }

  return (
    <main style={{ padding: 'var(--space-8)', display: 'grid', gap: 'var(--space-4)' }}>
      <h1 className="t-marca">Caderno do Caçador</h1>
      {sessao.estado === 'carregando' ? (
        <p className="t-detalhe">Abrindo o caderno.</p>
      ) : sessao.usuario ? (
        <p className="t-corpo">
          {sessao.usuario.displayName ?? sessao.usuario.email}.{' '}
          <button type="button" onClick={() => sair()}>
            Sair
          </button>
        </p>
      ) : (
        <p>
          <button type="button" onClick={entrar}>
            Entrar com Google
          </button>
        </p>
      )}
      {erro && (
        <p className="t-detalhe" role="alert">
          {erro}
        </p>
      )}
    </main>
  )
}
