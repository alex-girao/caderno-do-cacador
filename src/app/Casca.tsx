import { useEffect, useRef } from 'react'
import { sair } from '../firebase/auth.ts'
import { TelaFinalidades } from '../telas/finalidades/TelaFinalidades.tsx'
import { TelaItens } from '../telas/itens/TelaItens.tsx'
import { TelaObjetivos } from '../telas/objetivos/TelaObjetivos.tsx'
import { TelaOrigens } from '../telas/origens/TelaOrigens.tsx'
import { Botao } from '../ui/Botao.tsx'
import estilos from './Casca.module.css'
import { useUsuario } from './SessaoContext.tsx'
import { ROTAS, useRota, type Rota } from './useRota.ts'
import { useTema } from './useTema.ts'

const TELAS: Record<Rota, () => React.JSX.Element> = {
  objetivos: TelaObjetivos,
  itens: TelaItens,
  origens: TelaOrigens,
  finalidades: TelaFinalidades,
}

export function Casca() {
  const usuario = useUsuario()
  const rota = useRota()
  const { tema, alternar } = useTema()
  const principal = useRef<HTMLElement>(null)
  const primeiraRota = useRef(true)

  const nomeRota = ROTAS.find((r) => r.id === rota)!.nome
  const Tela = TELAS[rota]

  useEffect(() => {
    document.title = `${nomeRota} · Caderno do Caçador`
    // Ao trocar de seção, leva o foco ao conteúdo, como numa troca de página.
    if (primeiraRota.current) primeiraRota.current = false
    else principal.current?.focus()
  }, [nomeRota])

  return (
    <div className={estilos.casca}>
      <header className={estilos.cabecalho}>
        <div className={estilos.marcaENavegacao}>
          <p className="t-marca">Caderno do Caçador</p>
          <nav aria-label="Seções" className={estilos.navegacao}>
            {ROTAS.map((r) => (
              <a
                key={r.id}
                href={`#${r.id}`}
                aria-current={r.id === rota ? 'page' : undefined}
                className={estilos.link}
              >
                {r.nome}
              </a>
            ))}
          </nav>
        </div>
        <div className={estilos.acoes}>
          <span className="t-detalhe">{usuario.displayName ?? usuario.email}</span>
          <Botao
            variante="texto"
            onClick={alternar}
            aria-label={`Mudar para o tema ${tema === 'pergaminho' ? 'Fogueira' : 'Pergaminho'}`}
          >
            {tema === 'pergaminho' ? 'Fogueira' : 'Pergaminho'}
          </Botao>
          <Botao variante="texto" onClick={() => sair()}>
            Sair
          </Botao>
        </div>
      </header>
      <main ref={principal} tabIndex={-1} className={estilos.principal}>
        <Tela />
      </main>
    </div>
  )
}
