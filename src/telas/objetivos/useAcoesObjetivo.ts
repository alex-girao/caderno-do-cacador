import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useUid } from '../../app/SessaoContext.tsx'
import { objetivos as dadosObjetivos } from '../../dados/objetivos.ts'
import { ErroDeDominio, type Objetivo } from '../../domain/tipos.ts'
import { useConfirmacao } from '../../ui/confirmacaoContexto.ts'

const chave = (objetivoId: string, unidadeId: string) => `${objetivoId}/${unidadeId}`

/**
 * Marcações otimistas e ações de status do objetivo.
 *
 * O lacre muda na hora; a transação grava o valor desejado em seguida.
 * As transações de um mesmo objetivo rodam em fila, na ordem dos cliques.
 * A marcação pendente some quando o snapshot confirma o valor, ou é
 * desfeita, com aviso, se a transação falhar.
 */
export function useAcoesObjetivo(objetivos: Objetivo[]) {
  const uid = useUid()
  const { avisar } = useConfirmacao()
  const [pendentes, setPendentes] = useState<ReadonlyMap<string, boolean>>(new Map())
  const emVoo = useRef(new Map<string, number>())
  const filas = useRef(new Map<string, Promise<void>>())

  // Descarta pendências já confirmadas pelo snapshot e sem transação em andamento.
  useEffect(() => {
    const valores = new Map(objetivos.flatMap((o) => o.unidades.map((u) => [chave(o.id, u.id), u.obtido])))
    const confirmadas = [...pendentes].filter(
      ([k, obtido]) => !emVoo.current.get(k) && (valores.get(k) === obtido || !valores.has(k)),
    )
    if (confirmadas.length === 0) return
    setPendentes((atual) => {
      const nova = new Map(atual)
      for (const [k] of confirmadas) nova.delete(k)
      return nova
    })
  }, [objetivos, pendentes])

  const falhou = useCallback(
    (erro: unknown, titulo: string, padrao: string) =>
      avisar({ titulo, mensagem: erro instanceof ErroDeDominio ? erro.message : padrao }),
    [avisar],
  )

  const marcar = useCallback(
    (objetivo: Objetivo, unidadeId: string) => {
      const k = chave(objetivo.id, unidadeId)
      const atual = pendentes.get(k) ?? objetivo.unidades.find((u) => u.id === unidadeId)?.obtido
      const obtido = !atual
      setPendentes((p) => new Map(p).set(k, obtido))
      emVoo.current.set(k, (emVoo.current.get(k) ?? 0) + 1)

      const anterior = filas.current.get(objetivo.id) ?? Promise.resolve()
      const proxima = anterior
        .then(() => dadosObjetivos.marcarUnidade(uid, objetivo.id, unidadeId, obtido))
        .then(
          () => {
            emVoo.current.set(k, emVoo.current.get(k)! - 1)
            setPendentes((p) => new Map(p)) // reavalia a confirmação pelo snapshot
          },
          (erro) => {
            emVoo.current.set(k, emVoo.current.get(k)! - 1)
            setPendentes((p) => {
              const nova = new Map(p)
              nova.delete(k)
              return nova
            })
            falhou(
              erro,
              'Marcação não salva',
              'Não foi possível salvar a marcação. Verifique a conexão e tente de novo.',
            )
          },
        )
      filas.current.set(objetivo.id, proxima)
    },
    [uid, pendentes, falhou],
  )

  const finalizar = useCallback(
    (objetivo: Objetivo) =>
      dadosObjetivos
        .finalizar(uid, objetivo.id)
        .catch((erro) =>
          falhou(erro, 'Objetivo não finalizado', 'Não foi possível finalizar. Verifique a conexão e tente de novo.'),
        ),
    [uid, falhou],
  )

  const reverter = useCallback(
    (objetivo: Objetivo) =>
      dadosObjetivos
        .reverter(uid, objetivo.id)
        .catch((erro) =>
          falhou(erro, 'Objetivo não revertido', 'Não foi possível reverter. Verifique a conexão e tente de novo.'),
        ),
    [uid, falhou],
  )

  /** Objetivos com as marcações pendentes já aplicadas. */
  const exibidos = useMemo(() => {
    if (pendentes.size === 0) return objetivos
    return objetivos.map((o) => {
      if (!o.unidades.some((u) => pendentes.has(chave(o.id, u.id)))) return o
      return {
        ...o,
        unidades: o.unidades.map((u) => {
          const pendente = pendentes.get(chave(o.id, u.id))
          return pendente === undefined ? u : { ...u, obtido: pendente }
        }),
      }
    })
  }, [objetivos, pendentes])

  return { exibidos, marcar, finalizar, reverter }
}
