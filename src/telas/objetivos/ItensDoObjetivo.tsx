import { ITEM_REMOVIDO, type ItemDoCatalogo } from '../../domain/apresentacao.ts'
import { textoObtidasDaLinha, type LinhaItem } from '../../domain/edicaoObjetivo.ts'
import { Botao } from '../../ui/Botao.tsx'
import estilos from './ModalObjetivo.module.css'

interface Props {
  linhas: LinhaItem[]
  catalogo: ReadonlyMap<string, ItemDoCatalogo>
  /** Obtidas hoje por item, para projetar o progresso após o ajuste. */
  obtidasAtuais: ReadonlyMap<string, number>
  aoMudarQuantidade: (itemId: string, quantidade: number) => void
  aoRemover: (itemId: string) => void
}

const MAXIMO = 999

export function ItensDoObjetivo({ linhas, catalogo, obtidasAtuais, aoMudarQuantidade, aoRemover }: Props) {
  if (linhas.length === 0) {
    return <p className="t-detalhe">Nenhum item no objetivo. Adicione itens abaixo.</p>
  }

  return (
    <ul className={estilos.linhas}>
      {linhas.map(({ itemId, quantidade }) => {
        const item = catalogo.get(itemId)
        const nome = item?.nome ?? ITEM_REMOVIDO
        const progresso = textoObtidasDaLinha({ itemId, quantidade, obtidas: obtidasAtuais.get(itemId) ?? 0 })
        return (
          <li key={itemId} className={estilos.linha}>
            <span className={estilos.nomeLinha}>
              <span className={item ? 't-corpo' : `t-corpo ${estilos.removido}`}>{nome}</span>{' '}
              <span className="t-detalhe">{item ? `${item.origem}, ${progresso}` : progresso}</span>
            </span>
            <span className={estilos.quantidade}>
              <button
                type="button"
                className={estilos.passo}
                aria-label={`Diminuir ${nome}`}
                disabled={quantidade <= 1}
                onClick={() => aoMudarQuantidade(itemId, quantidade - 1)}
              >
                −
              </button>
              <span className={estilos.valor} aria-live="polite">
                {quantidade}
              </span>
              <button
                type="button"
                className={estilos.passo}
                aria-label={`Aumentar ${nome}`}
                // Unidades de um item excluído seriam recusadas na gravação.
                disabled={!item || quantidade >= MAXIMO}
                onClick={() => aoMudarQuantidade(itemId, quantidade + 1)}
              >
                +
              </button>
            </span>
            <Botao variante="texto" aria-label={`Remover ${nome}`} onClick={() => aoRemover(itemId)}>
              Remover
            </Botao>
          </li>
        )
      })}
    </ul>
  )
}
