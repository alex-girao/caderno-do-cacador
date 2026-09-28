import { chaveDoNome, ordenarPorNome } from './cadastros.ts'
import type { Item } from './tipos.ts'

export interface FiltroCatalogo {
  /** Trecho do nome, comparado sem diferença de caixa, acentos e espaços (RN05). */
  texto: string
  /** Origem escolhida, ou vazio para todas (RN05). */
  origemId: string
  /** Itens já presentes no objetivo, que não aparecem para adicionar. */
  excluir?: ReadonlySet<string>
}

/** Itens do catálogo que atendem aos filtros, em ordem alfabética. */
export function filtrarCatalogo<T extends Pick<Item, 'id' | 'nome' | 'origemId'>>(
  itens: readonly T[],
  { texto, origemId, excluir }: FiltroCatalogo,
): T[] {
  const trecho = chaveDoNome(texto)
  return ordenarPorNome(
    itens.filter(
      (i) =>
        !excluir?.has(i.id) &&
        (!origemId || i.origemId === origemId) &&
        (!trecho || chaveDoNome(i.nome).includes(trecho)),
    ),
  )
}
