import { describe, expect, it } from 'vitest'
import {
  agruparPorStatus,
  instanteDeReferencia,
  ordenarObjetivos,
  type ObjetivoOrdenavel,
} from './ordenacao.ts'
import type { Unidade } from './tipos.ts'

const H = 60 * 60 * 1000

const un = (...obtidos: boolean[]): Unidade[] =>
  obtidos.map((obtido, i) => ({ id: `u${i}`, itemId: 'pena', obtido }))

const obj = (
  id: string,
  unidades: Unidade[],
  criadoEm: number,
  alteradoEm: number | null = null,
  finalizado = false,
): ObjetivoOrdenavel => ({ id, unidades, criadoEm, alteradoEm, finalizado })

const ids = (lista: ObjetivoOrdenavel[]) => lista.map((o) => o.id)

describe('instanteDeReferencia', () => {
  it('usa alteradoEm quando preenchido', () => {
    expect(instanteDeReferencia(obj('a', un(false), 1 * H, 5 * H))).toBe(5 * H)
  })

  it('usa criadoEm quando alteradoEm está vazio', () => {
    expect(instanteDeReferencia(obj('a', un(false), 1 * H))).toBe(1 * H)
  })
})

describe('ordenarObjetivos', () => {
  it('ordena por status: Buscando, Obtido, Aguardando, Finalizado (RN23)', () => {
    const lista = [
      obj('finalizado', un(true), 9 * H, null, true),
      obj('aguardando', un(false), 8 * H),
      obj('obtido', un(true), 1 * H),
      obj('buscando', un(true, false), 0),
    ]
    expect(ids(ordenarObjetivos(lista))).toEqual(['buscando', 'obtido', 'aguardando', 'finalizado'])
  })

  it('dentro do status, do mais recente para o mais antigo (RN24)', () => {
    const lista = [
      obj('antigo', un(true, false), 1 * H, 2 * H),
      obj('recente', un(true, false), 1 * H, 9 * H),
      obj('meio', un(true, false), 5 * H, 6 * H),
    ]
    expect(ids(ordenarObjetivos(lista))).toEqual(['recente', 'meio', 'antigo'])
  })

  it('compara alteradoEm de um com criadoEm de outro quando alteradoEm está vazio (RN24)', () => {
    const lista = [
      obj('alterado', un(false), 1 * H, 3 * H),
      obj('criado-depois', un(false), 4 * H),
      obj('criado-antes', un(false), 2 * H),
    ]
    expect(ids(ordenarObjetivos(lista))).toEqual(['criado-depois', 'alterado', 'criado-antes'])
  })

  it('status tem precedência sobre o instante', () => {
    const lista = [obj('aguardando-recente', un(false), 9 * H), obj('buscando-antigo', un(true, false), 0)]
    expect(ids(ordenarObjetivos(lista))).toEqual(['buscando-antigo', 'aguardando-recente'])
  })

  it('objetivo finalizado vai para o fim, mesmo sendo o mais recente (RN12)', () => {
    const lista = [
      obj('finalizado-agora', un(true), 0, 10 * H, true),
      obj('aguardando-velho', un(false), 0),
    ]
    expect(ids(ordenarObjetivos(lista))).toEqual(['aguardando-velho', 'finalizado-agora'])
  })

  it('objetivo sem itens fica no grupo Aguardando', () => {
    const lista = [obj('sem-itens', [], 5 * H), obj('obtido', un(true), 1 * H)]
    expect(ids(ordenarObjetivos(lista))).toEqual(['obtido', 'sem-itens'])
  })

  it('desempata instantes iguais pelo id, de forma estável', () => {
    const lista = [obj('c', un(false), H), obj('a', un(false), H), obj('b', un(false), H)]
    expect(ids(ordenarObjetivos(lista))).toEqual(['a', 'b', 'c'])
    expect(ids(ordenarObjetivos([...lista].reverse()))).toEqual(['a', 'b', 'c'])
  })

  it('não altera a lista original', () => {
    const lista = [obj('aguardando', un(false), 0), obj('buscando', un(true, false), 0)]
    ordenarObjetivos(lista)
    expect(ids(lista)).toEqual(['aguardando', 'buscando'])
  })

  it('aceita lista vazia', () => {
    expect(ordenarObjetivos([])).toEqual([])
  })
})

describe('agruparPorStatus', () => {
  it('devolve os quatro grupos na ordem da RN23, cada um ordenado pela RN24', () => {
    const lista = [
      obj('b1', un(true, false), 0, 1 * H),
      obj('f1', un(true), 0, 7 * H, true),
      obj('b2', un(true, false), 0, 3 * H),
      obj('a1', un(false), 2 * H),
    ]
    const grupos = agruparPorStatus(lista)
    expect(grupos.map((g) => g.status)).toEqual(['Buscando', 'Obtido', 'Aguardando', 'Finalizado'])
    expect(grupos.map((g) => ids(g.objetivos))).toEqual([['b2', 'b1'], [], ['a1'], ['f1']])
  })

  it('devolve grupos vazios para lista vazia', () => {
    expect(agruparPorStatus([]).every((g) => g.objetivos.length === 0)).toBe(true)
  })
})
