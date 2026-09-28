import {
  anotarUnidades,
  metaDoObjetivo,
  textoProgresso,
  type ItemDoCatalogo,
} from '../../domain/apresentacao.ts'
import { resumirObjetivo } from '../../domain/status.ts'
import type { Objetivo } from '../../domain/tipos.ts'
import { Botao } from '../../ui/Botao.tsx'
import { Carimbo } from './Carimbo.tsx'
import estilos from './CartaoObjetivo.module.css'
import { Lacre } from './Lacre.tsx'

export interface AcoesDoCartao {
  aoAlternar: (objetivo: Objetivo, unidadeId: string) => void
  aoFinalizar: (objetivo: Objetivo) => void
  aoReverter: (objetivo: Objetivo) => void
  aoEditar: (objetivo: Objetivo) => void
  aoExcluir: (objetivo: Objetivo) => void
}

interface Props {
  objetivo: Objetivo
  finalidade: string
  catalogo: ReadonlyMap<string, ItemDoCatalogo>
  agora: number
  acoes?: Partial<AcoesDoCartao>
}

export function CartaoObjetivo({ objetivo, finalidade, catalogo, agora, acoes = {} }: Props) {
  const resumo = resumirObjetivo(objetivo)
  const unidades = anotarUnidades(objetivo.unidades, catalogo)
  const travado = !resumo.podeMarcar || !acoes.aoAlternar

  return (
    <article className={objetivo.finalizado ? `${estilos.cartao} ${estilos.finalizado}` : estilos.cartao}>
      <div className={estilos.topo}>
        <Carimbo status={resumo.status} />
        <div className={estilos.acoesTopo}>
          {acoes.aoEditar && (
            <Botao variante="texto" aria-label={`Editar ${objetivo.nome}`} onClick={() => acoes.aoEditar!(objetivo)}>
              Editar
            </Botao>
          )}
          {acoes.aoExcluir && (
            <Botao variante="texto" aria-label={`Excluir ${objetivo.nome}`} onClick={() => acoes.aoExcluir!(objetivo)}>
              Excluir
            </Botao>
          )}
        </div>
      </div>

      <div className={estilos.cabecalho}>
        <h3 className="t-titulo">{objetivo.nome}</h3>
        <p className="t-detalhe">{metaDoObjetivo(finalidade, objetivo.criadoEm, objetivo.alteradoEm, agora)}</p>
      </div>

      {resumo.avisoSemItens ? (
        <p className={`t-corpo ${estilos.semItens}`}>
          <strong>Sem itens.</strong> Edite o objetivo para adicionar itens ou exclua-o.
        </p>
      ) : (
        <ul className={estilos.checklist} aria-label={`Itens de ${objetivo.nome}`}>
          {unidades.map(({ unidade, nome, anotacao, removido }) => (
            <li key={unidade.id}>
              <button
                type="button"
                className={estilos.unidade}
                aria-pressed={unidade.obtido}
                disabled={travado}
                onClick={() => acoes.aoAlternar?.(objetivo, unidade.id)}
              >
                <Lacre obtido={unidade.obtido} />
                <span
                  className={[estilos.nome, unidade.obtido && estilos.riscado, removido && estilos.removido]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {nome}
                </span>
                {anotacao && <span className="t-detalhe">{anotacao}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className={estilos.rodape}>
        <span className="t-detalhe">{textoProgresso(resumo.obtidas, resumo.total)}</span>
        {resumo.podeFinalizar && acoes.aoFinalizar && (
          <Botao variante="primario" onClick={() => acoes.aoFinalizar!(objetivo)}>
            Finalizado
          </Botao>
        )}
        {resumo.podeReverter && acoes.aoReverter && (
          <Botao onClick={() => acoes.aoReverter!(objetivo)}>Reverter</Botao>
        )}
      </div>
    </article>
  )
}
