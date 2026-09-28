import { useState } from 'react'
import { useUid } from '../../app/SessaoContext.tsx'
import { useItens, useOrigens } from '../../dados/hooks.ts'
import { itens as dadosItens } from '../../dados/itens.ts'
import { ordenarPorNome } from '../../domain/cadastros.ts'
import { textoConfirmacaoExclusaoItem } from '../../domain/exclusao.ts'
import { quantificar } from '../../domain/texto.ts'
import type { Item } from '../../domain/tipos.ts'
import { Botao } from '../../ui/Botao.tsx'
import { CabecalhoTela } from '../../ui/CabecalhoTela.tsx'
import { ListaCadastro } from '../../ui/ListaCadastro.tsx'
import { useExclusao } from '../../ui/useExclusao.ts'
import { ModalItem } from './ModalItem.tsx'

type Edicao = { modo: 'novo' } | { modo: 'editar'; item: Item } | null

export function TelaItens() {
  const uid = useUid()
  const lista = useItens()
  const listaOrigens = useOrigens()
  const [edicao, setEdicao] = useState<Edicao>(null)

  const itens = lista.estado === 'pronta' ? lista.registros : []
  const origens = listaOrigens.estado === 'pronta' ? listaOrigens.registros : []
  const nomeDaOrigem = new Map(origens.map((o) => [o.id, o.nome]))
  const excluir = useExclusao()

  const itemPorId = (id: string) => itens.find((i) => i.id === id)!

  function aoExcluir(item: Item) {
    excluir(async () => {
      const previa = await dadosItens.preverExclusao(uid, item.id)
      return {
        bloqueada: false,
        titulo: 'Excluir item',
        mensagem: textoConfirmacaoExclusaoItem(item.nome, previa.impacto),
        excluir: () => dadosItens.excluirEmCascata(uid, item.id, previa.objetivoIds),
      }
    })
  }

  return (
    <>
      <CabecalhoTela
        titulo="Itens"
        detalhe={lista.estado === 'pronta' ? quantificar(itens.length, 'item', 'itens') : undefined}
        acao={
          <Botao
            variante="primario"
            onClick={() => setEdicao({ modo: 'novo' })}
            disabled={listaOrigens.estado !== 'pronta'}
          >
            Novo item
          </Botao>
        }
      />
      <ListaCadastro
        lista={lista}
        linhas={(rs) =>
          ordenarPorNome(rs).map((i) => ({
            id: i.id,
            nome: i.nome,
            detalhe: nomeDaOrigem.get(i.origemId) ?? (listaOrigens.estado === 'pronta' ? 'Sem origem' : undefined),
          }))
        }
        vazio="Nenhum item no caderno. Cadastre o primeiro, como Pena de Ganso ou Pele de Cervo."
        acoes={(linha) => (
          <>
            <Botao
              variante="texto"
              aria-label={`Editar ${linha.nome}`}
              onClick={() => setEdicao({ modo: 'editar', item: itemPorId(linha.id) })}
            >
              Editar
            </Botao>
            <Botao
              variante="texto"
              aria-label={`Excluir ${linha.nome}`}
              onClick={() => aoExcluir(itemPorId(linha.id))}
            >
              Excluir
            </Botao>
          </>
        )}
      />
      {edicao && (
        <ModalItem
          item={edicao.modo === 'editar' ? edicao.item : undefined}
          existentes={itens}
          origens={origens}
          salvar={async (dados) => {
            if (edicao.modo === 'editar') await dadosItens.editar(uid, edicao.item.id, dados)
            else await dadosItens.criar(uid, dados)
          }}
          aoFechar={() => setEdicao(null)}
        />
      )}
    </>
  )
}
