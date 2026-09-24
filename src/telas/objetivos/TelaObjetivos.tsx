import { useMemo, useState } from 'react'
import { useFinalidades, useItens, useObjetivos, useOrigens } from '../../dados/hooks.ts'
import { registrosDe } from '../../dados/useAssinatura.ts'
import type { ItemDoCatalogo } from '../../domain/apresentacao.ts'
import { agruparPorStatus } from '../../domain/ordenacao.ts'
import { quantificar } from '../../domain/texto.ts'
import { Botao } from '../../ui/Botao.tsx'
import { CabecalhoTela } from '../../ui/CabecalhoTela.tsx'
import { useAgora } from '../../ui/useAgora.ts'
import { CartaoObjetivo } from './CartaoObjetivo.tsx'
import { GrupoStatus } from './GrupoStatus.tsx'
import { ModalObjetivo } from './ModalObjetivo.tsx'
import { useAcoesObjetivo } from './useAcoesObjetivo.ts'

type Edicao = { modo: 'novo' } | { modo: 'editar'; id: string } | null

export function TelaObjetivos() {
  const [edicao, setEdicao] = useState<Edicao>(null)
  const listaObjetivos = useObjetivos()
  const listaItens = useItens()
  const listaOrigens = useOrigens()
  const listaFinalidades = useFinalidades()
  const agora = useAgora()

  const listas = [listaObjetivos, listaItens, listaOrigens, listaFinalidades]
  const objetivos = registrosDe(listaObjetivos)
  const itens = registrosDe(listaItens)
  const origens = registrosDe(listaOrigens)
  const finalidades = registrosDe(listaFinalidades)

  const catalogo = useMemo(() => {
    const nomeOrigem = new Map(origens.map((o) => [o.id, o.nome]))
    return new Map<string, ItemDoCatalogo>(
      itens.map((i) => [i.id, { nome: i.nome, origem: nomeOrigem.get(i.origemId) ?? '' }]),
    )
  }, [itens, origens])
  const nomeFinalidade = useMemo(() => new Map(finalidades.map((f) => [f.id, f.nome])), [finalidades])
  const { exibidos, marcar, finalizar, reverter } = useAcoesObjetivo(objetivos)
  const acoes = useMemo(
    () => ({
      aoAlternar: marcar,
      aoFinalizar: finalizar,
      aoReverter: reverter,
      aoEditar: (o: { id: string }) => setEdicao({ modo: 'editar', id: o.id }),
    }),
    [marcar, finalizar, reverter],
  )
  const grupos = useMemo(() => agruparPorStatus(exibidos).filter((g) => g.objetivos.length > 0), [exibidos])

  const todasProntas = listas.every((l) => l.estado === 'pronta')
  // Na edição, o modal acompanha o objetivo atual; se ele for excluído, o modal fecha.
  const emEdicao = edicao?.modo === 'editar' ? objetivos.find((o) => o.id === edicao.id) : undefined

  const conteudo = () => {
    if (listas.some((l) => l.estado === 'erro')) {
      return (
        <p className="t-detalhe" role="alert">
          Não foi possível carregar os objetivos. Verifique a conexão e recarregue a página.
        </p>
      )
    }
    if (listas.some((l) => l.estado === 'carregando')) return <p className="t-detalhe">Abrindo o caderno.</p>
    if (objetivos.length === 0) {
      return <p className="t-corpo">Nenhum objetivo no caderno. Cadastre o primeiro para começar a caçada.</p>
    }
    return grupos.map((grupo) => (
      <GrupoStatus key={grupo.status} status={grupo.status} quantidade={grupo.objetivos.length}>
        {grupo.objetivos.map((objetivo) => (
          <CartaoObjetivo
            key={objetivo.id}
            objetivo={objetivo}
            finalidade={nomeFinalidade.get(objetivo.finalidadeId) ?? 'Finalidade removida'}
            catalogo={catalogo}
            agora={agora}
            acoes={acoes}
          />
        ))}
      </GrupoStatus>
    ))
  }

  return (
    <>
      <CabecalhoTela
        titulo="Objetivos"
        detalhe={listaObjetivos.estado === 'pronta' ? quantificar(objetivos.length, 'objetivo', 'objetivos') : undefined}
        acao={
          <Botao variante="primario" onClick={() => setEdicao({ modo: 'novo' })} disabled={!todasProntas}>
            Novo objetivo
          </Botao>
        }
      />
      {conteudo()}
      {todasProntas && (edicao?.modo === 'novo' || emEdicao) && (
        <ModalObjetivo
          key={emEdicao?.id ?? 'novo'}
          objetivo={emEdicao}
          itens={itens}
          origens={origens}
          finalidades={finalidades}
          catalogo={catalogo}
          aoFechar={() => setEdicao(null)}
        />
      )}
    </>
  )
}
