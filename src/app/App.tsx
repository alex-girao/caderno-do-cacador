import { useEffect, useState } from 'react'
import type { User } from 'firebase/auth'
import { observarUsuario } from '../firebase/auth.ts'
import { Casca } from './Casca.tsx'
import { SessaoContext } from './SessaoContext.tsx'
import { TelaLogin } from './TelaLogin.tsx'

type Sessao = { estado: 'carregando' } | { estado: 'pronta'; usuario: User | null }

export default function App() {
  const [sessao, setSessao] = useState<Sessao>({ estado: 'carregando' })

  useEffect(() => observarUsuario((usuario) => setSessao({ estado: 'pronta', usuario })), [])

  if (sessao.estado === 'carregando') {
    return (
      <p className="t-detalhe" style={{ padding: 'var(--space-8)' }}>
        Abrindo o caderno.
      </p>
    )
  }

  if (!sessao.usuario) return <TelaLogin />

  return (
    <SessaoContext.Provider value={sessao.usuario}>
      <Casca />
    </SessaoContext.Provider>
  )
}
