import { useRef, useState } from 'react'
import type { RegistroPorNome } from '../../dados/cadastroPorNome.ts'
import type { ItemDoCatalogo } from '../../domain/apresentacao.ts'
import { ordenarPorNome } from '../../domain/cadastros.ts'
import { filtrarCatalogo } from '../../domain/catalogo.ts'
import type { Item } from '../../domain/tipos.ts'
import { Botao } from '../../ui/Botao.tsx'
import { Campo, Selecao } from '../../ui/Campo.tsx'
import estilos from './ModalObjetivo.module.css'

interface Props {
  itens: Item[]
  origens: RegistroPorNome[]
  catalogo: ReadonlyMap<string, ItemDoCatalogo>
  /** Itens já no objetivo, que não aparecem para adicionar. */
  presentes: ReadonlySet<string>
  aoAdicionar: (itemId: string) => void
}

/** Lista filtrável por nome e por origem para escolher itens do catálogo (RN05). */
export function SeletorDeItens({ itens, origens, catalogo, presentes, aoAdicionar }: Props) {
  const [texto, setTexto] = useState('')
  const [origemId, setOrigemId] = useState('')
  const campoTexto = useRef<HTMLInputElement>(null)
  const disponiveis = filtrarCatalogo(itens, { texto, origemId, excluir: presentes })

  function adicionar(itemId: string) {
    aoAdicionar(itemId)
    // O item sai da lista; o foco volta ao filtro para continuar escolhendo.
    campoTexto.current?.focus()
  }

  return (
    <section className={estilos.adicionar} aria-labelledby="titulo-adicionar-itens">
      <h3 id="titulo-adicionar-itens" className={estilos.subtitulo}>
        Adicionar itens
      </h3>
      {itens.length === 0 ? (
        <p className="t-corpo">
          Nenhum item no catálogo. <a href="#itens">Cadastre itens</a> para montar o objetivo.
        </p>
      ) : (
        <>
          <div className={estilos.duasColunas}>
            <Campo
              ref={campoTexto}
              rotulo="Filtrar por nome"
              type="search"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              autoComplete="off"
            />
            <Selecao rotulo="Filtrar por origem" value={origemId} onChange={(e) => setOrigemId(e.target.value)}>
              <option value="">Todas as origens</option>
              {ordenarPorNome(origens).map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nome}
                </option>
              ))}
            </Selecao>
          </div>
          {disponiveis.length === 0 ? (
            <p className="t-detalhe">Nenhum item encontrado com esses filtros.</p>
          ) : (
            <ul className={estilos.disponiveis}>
              {disponiveis.map((item) => (
                <li key={item.id} className={estilos.disponivel}>
                  <span>
                    <span className="t-corpo">{item.nome}</span>{' '}
                    <span className="t-detalhe">{catalogo.get(item.id)?.origem}</span>
                  </span>
                  <Botao aria-label={`Adicionar ${item.nome}`} onClick={() => adicionar(item.id)}>
                    Adicionar
                  </Botao>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}
