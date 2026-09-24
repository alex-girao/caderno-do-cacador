import { describe, expect, it } from 'vitest'
import { calcularStatus } from './status.ts'
import { ErroDeDominio } from './tipos.ts'
import type { EstadoObjetivo, Unidade } from './tipos.ts'
import {
  adicionarUnidades,
  alternarUnidade,
  calcularItemIds,
  criarUnidades,
  finalizar,
  montarNovoObjetivo,
  reverter,
} from './transicoes.ts'

const sequencial = () => {
  let n = 0
  return () => `u${++n}`
}

const unidade = (id: string, itemId: string, obtido: boolean): Unidade => ({ id, itemId, obtido })

/** Aplica um patch como a persistência faria, para encadear transições. */
const aplicar = (objetivo: EstadoObjetivo, patch: Partial<EstadoObjetivo>): EstadoObjetivo => ({
  ...objetivo,
  ...patch,
})

describe('calcularItemIds', () => {
  it('lista os itens distintos na ordem em que aparecem', () => {
    const unidades = [
      unidade('1', 'pena', false),
      unidade('2', 'pele', true),
      unidade('3', 'pena', true),
    ]
    expect(calcularItemIds(unidades)).toEqual(['pena', 'pele'])
  })

  it('é vazio sem unidades', () => {
    expect(calcularItemIds([])).toEqual([])
  })
})

describe('criarUnidades', () => {
  it('gera uma unidade não obtida por quantidade (RN06)', () => {
    expect(criarUnidades('pena', 3, sequencial())).toEqual([
      unidade('u1', 'pena', false),
      unidade('u2', 'pena', false),
      unidade('u3', 'pena', false),
    ])
  })

  it.each([0, -1, 1.5, Number.NaN])('rejeita quantidade %s', (quantidade) => {
    expect(() => criarUnidades('pena', quantidade)).toThrow(ErroDeDominio)
  })

  it('usa ids aleatórios distintos por padrão', () => {
    const [a, b] = criarUnidades('pena', 2)
    expect(a.id).not.toBe(b.id)
  })
})

describe('montarNovoObjetivo', () => {
  it('nasce Aguardando, não finalizado e com itemIds calculado (RN09)', () => {
    const novo = montarNovoObjetivo(
      [
        { itemId: 'pele', quantidade: 1 },
        { itemId: 'pena', quantidade: 3 },
      ],
      sequencial(),
    )
    expect(novo.unidades).toHaveLength(4)
    expect(novo.itemIds).toEqual(['pele', 'pena'])
    expect(novo.finalizado).toBe(false)
    expect(novo.finalizadoEm).toBeNull()
    expect(calcularStatus(novo)).toBe('Aguardando')
  })

  it('exige pelo menos uma unidade (RN07)', () => {
    expect(() => montarNovoObjetivo([])).toThrow(ErroDeDominio)
  })
})

describe('alternarUnidade', () => {
  const aguardando: EstadoObjetivo = {
    finalizado: false,
    unidades: [unidade('a', 'pele', false), unidade('b', 'pena', false)],
  }

  it('Aguardando → Buscando ao marcar a primeira unidade (RN10)', () => {
    const buscando = aplicar(aguardando, alternarUnidade(aguardando, 'a'))
    expect(buscando.unidades[0].obtido).toBe(true)
    expect(calcularStatus(buscando)).toBe('Buscando')
  })

  it('Buscando → Obtido ao marcar a última unidade (RN11)', () => {
    const buscando = aplicar(aguardando, alternarUnidade(aguardando, 'a'))
    const obtido = aplicar(buscando, alternarUnidade(buscando, 'b'))
    expect(calcularStatus(obtido)).toBe('Obtido')
  })

  it('Obtido → Buscando ao desmarcar uma unidade (RN14)', () => {
    const obtido: EstadoObjetivo = {
      finalizado: false,
      unidades: [unidade('a', 'pele', true), unidade('b', 'pena', true)],
    }
    expect(calcularStatus(aplicar(obtido, alternarUnidade(obtido, 'a')))).toBe('Buscando')
  })

  it('Buscando → Aguardando ao desmarcar a única obtida (RN14)', () => {
    const buscando: EstadoObjetivo = {
      finalizado: false,
      unidades: [unidade('a', 'pele', true), unidade('b', 'pena', false)],
    }
    expect(calcularStatus(aplicar(buscando, alternarUnidade(buscando, 'a')))).toBe('Aguardando')
  })

  it('com uma só unidade vai de Aguardando direto a Obtido e volta', () => {
    const unica: EstadoObjetivo = { finalizado: false, unidades: [unidade('a', 'pele', false)] }
    const obtido = aplicar(unica, alternarUnidade(unica, 'a'))
    expect(calcularStatus(obtido)).toBe('Obtido')
    expect(calcularStatus(aplicar(obtido, alternarUnidade(obtido, 'a')))).toBe('Aguardando')
  })

  it('altera apenas a unidade indicada, sem mutar o original', () => {
    const patch = alternarUnidade(aguardando, 'b')
    expect(patch.unidades).toEqual([unidade('a', 'pele', false), unidade('b', 'pena', true)])
    expect(aguardando.unidades[1].obtido).toBe(false)
  })

  it('distingue unidades do mesmo item pelo id', () => {
    const tres: EstadoObjetivo = {
      finalizado: false,
      unidades: [unidade('1', 'pena', false), unidade('2', 'pena', false), unidade('3', 'pena', false)],
    }
    expect(alternarUnidade(tres, '2').unidades.map((u) => u.obtido)).toEqual([false, true, false])
  })

  it('devolve itemIds recalculado', () => {
    expect(alternarUnidade(aguardando, 'a').itemIds).toEqual(['pele', 'pena'])
  })

  it('recusa marcar ou desmarcar em objetivo finalizado (RN14)', () => {
    const finalizado: EstadoObjetivo = { finalizado: true, unidades: [unidade('a', 'pele', true)] }
    expect(() => alternarUnidade(finalizado, 'a')).toThrow(ErroDeDominio)
  })

  it('recusa unidade inexistente', () => {
    expect(() => alternarUnidade(aguardando, 'x')).toThrow(ErroDeDominio)
  })
})

describe('finalizar', () => {
  it('Obtido → Finalizado, marcando finalizadoEm para agora (RN12)', () => {
    const obtido: EstadoObjetivo = { finalizado: false, unidades: [unidade('a', 'pele', true)] }
    const patch = finalizar(obtido)
    expect(patch).toEqual({ finalizado: true, finalizadoEm: 'agora' })
    expect(calcularStatus(aplicar(obtido, patch))).toBe('Finalizado')
  })

  it.each([
    ['Aguardando', [unidade('a', 'pele', false)]],
    ['Buscando', [unidade('a', 'pele', true), unidade('b', 'pena', false)]],
  ])('recusa finalizar a partir de %s', (_status, unidades) => {
    expect(() => finalizar({ finalizado: false, unidades })).toThrow(ErroDeDominio)
  })

  it('recusa finalizar o que já está finalizado', () => {
    expect(() => finalizar({ finalizado: true, unidades: [unidade('a', 'pele', true)] })).toThrow(
      ErroDeDominio,
    )
  })

  it('recusa finalizar objetivo sem itens', () => {
    expect(() => finalizar({ finalizado: false, unidades: [] })).toThrow(ErroDeDominio)
  })
})

describe('reverter', () => {
  it('Finalizado → Obtido, limpando finalizadoEm (RN13)', () => {
    const finalizado: EstadoObjetivo = { finalizado: true, unidades: [unidade('a', 'pele', true)] }
    const patch = reverter(finalizado)
    expect(patch).toEqual({ finalizado: false, finalizadoEm: null })
    expect(calcularStatus(aplicar(finalizado, patch))).toBe('Obtido')
  })

  it('recusa reverter objetivo não finalizado', () => {
    expect(() => reverter({ finalizado: false, unidades: [unidade('a', 'pele', true)] })).toThrow(
      ErroDeDominio,
    )
  })

  it('libera as marcações de novo após reverter (RN14)', () => {
    const finalizado: EstadoObjetivo = { finalizado: true, unidades: [unidade('a', 'pele', true)] }
    const revertido = aplicar(finalizado, reverter(finalizado))
    expect(calcularStatus(aplicar(revertido, alternarUnidade(revertido, 'a')))).toBe('Aguardando')
  })
})

describe('adicionarUnidades', () => {
  const finalizado: EstadoObjetivo = {
    finalizado: true,
    unidades: [unidade('a', 'pele', true), unidade('b', 'pena', true)],
  }

  it('em objetivo finalizado, limpa finalizado e finalizadoEm na mesma escrita (RN15)', () => {
    const patch = adicionarUnidades(finalizado, criarUnidades('dente', 2, sequencial()))
    expect(patch.finalizado).toBe(false)
    expect(patch.finalizadoEm).toBeNull()
    expect(patch.unidades).toHaveLength(4)
    expect(patch.itemIds).toEqual(['pele', 'pena', 'dente'])
  })

  it('Finalizado → Buscando ao adicionar unidade não obtida (RN15)', () => {
    const patch = adicionarUnidades(finalizado, [unidade('c', 'dente', false)])
    expect(calcularStatus(aplicar(finalizado, patch))).toBe('Buscando')
  })

  it('mantém finalizado se as unidades adicionadas já estiverem obtidas', () => {
    const patch = adicionarUnidades(finalizado, [unidade('c', 'dente', true)])
    expect(patch).not.toHaveProperty('finalizado')
    expect(patch).not.toHaveProperty('finalizadoEm')
    expect(calcularStatus(aplicar(finalizado, patch))).toBe('Finalizado')
  })

  it('em objetivo não finalizado, não toca em finalizado', () => {
    const obtido: EstadoObjetivo = { finalizado: false, unidades: [unidade('a', 'pele', true)] }
    const patch = adicionarUnidades(obtido, [unidade('c', 'dente', false)])
    expect(patch).not.toHaveProperty('finalizado')
    expect(calcularStatus(aplicar(obtido, patch))).toBe('Buscando')
  })

  it('tira o objetivo do estado sem itens', () => {
    const vazio: EstadoObjetivo = { finalizado: false, unidades: [] }
    const patch = adicionarUnidades(vazio, [unidade('c', 'dente', false)])
    expect(patch.unidades).toHaveLength(1)
    expect(patch.itemIds).toEqual(['dente'])
    expect(calcularStatus(aplicar(vazio, patch))).toBe('Aguardando')
  })

  it('em objetivo finalizado sem itens, volta a Aguardando (RN15)', () => {
    const finalizadoVazio: EstadoObjetivo = { finalizado: true, unidades: [] }
    const patch = adicionarUnidades(finalizadoVazio, [unidade('c', 'dente', false)])
    expect(patch.finalizado).toBe(false)
    expect(calcularStatus(aplicar(finalizadoVazio, patch))).toBe('Aguardando')
  })

  it('não muta o objetivo original', () => {
    adicionarUnidades(finalizado, [unidade('c', 'dente', false)])
    expect(finalizado.unidades).toHaveLength(2)
    expect(finalizado.finalizado).toBe(true)
  })
})
