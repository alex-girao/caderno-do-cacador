import { describe, expect, it } from 'vitest'
import { anotarUnidades, metaDoObjetivo, tempoRelativo, textoProgresso } from './apresentacao.ts'
import type { Unidade } from './tipos.ts'

const MIN = 60_000
const H = 60 * MIN
const D = 24 * H
const AGORA = 1_000 * D

describe('tempoRelativo', () => {
  it.each([
    [0, 'agora mesmo'],
    [20_000, 'agora mesmo'],
    [MIN, 'há 1 min'],
    [25 * MIN, 'há 25 min'],
    [60 * MIN, 'há 1 hora'],
    [5 * H, 'há 5 horas'],
    [24 * H, 'há 1 dia'],
    [4 * D, 'há 4 dias'],
    [29 * D, 'há 29 dias'],
    [30 * D, 'há 1 mês'],
    [90 * D, 'há 3 meses'],
    [365 * D, 'há 1 ano'],
    [800 * D, 'há 2 anos'],
  ])('%i ms atrás → %s', (atras, esperado) => {
    expect(tempoRelativo(AGORA - atras, AGORA)).toBe(esperado)
  })

  it('trata instantes no futuro (relógio adiantado do servidor) como agora', () => {
    expect(tempoRelativo(AGORA + 5 * MIN, AGORA)).toBe('agora mesmo')
  })
})

describe('metaDoObjetivo', () => {
  it('usa alteradoEm quando preenchido', () => {
    expect(metaDoObjetivo('Bolsa', AGORA - 3 * D, AGORA - 2 * H, AGORA)).toBe('Bolsa, alterado há 2 horas')
  })

  it('usa criadoEm enquanto alteradoEm está vazio', () => {
    expect(metaDoObjetivo('Acampamento', AGORA - D, null, AGORA)).toBe('Acampamento, criado há 1 dia')
  })
})

describe('textoProgresso', () => {
  it.each([
    [3, 5, '3 de 5 obtidas'],
    [0, 1, '0 de 1 obtida'],
    [1, 1, '1 de 1 obtida'],
  ])('%i de %i → %s', (obtidas, total, esperado) => {
    expect(textoProgresso(obtidas, total)).toBe(esperado)
  })
})

describe('anotarUnidades', () => {
  const catalogo = new Map([
    ['pele', { nome: 'Pele de Cervo', origem: 'Animal' }],
    ['pena', { nome: 'Pena de Ganso', origem: 'Animal' }],
  ])
  const u = (id: string, itemId: string, obtido = false): Unidade => ({ id, itemId, obtido })

  it('anota a origem e, para itens repetidos, a posição', () => {
    const anotadas = anotarUnidades([u('1', 'pele'), u('2', 'pena', true), u('3', 'pena'), u('4', 'pena')], catalogo)
    expect(anotadas.map((a) => [a.nome, a.anotacao])).toEqual([
      ['Pele de Cervo', 'Animal'],
      ['Pena de Ganso', 'Animal, 1 de 3'],
      ['Pena de Ganso', 'Animal, 2 de 3'],
      ['Pena de Ganso', 'Animal, 3 de 3'],
    ])
    expect(anotadas[1].unidade.obtido).toBe(true)
  })

  it('exibe unidades de item inexistente como "Item removido", sem quebrar', () => {
    const anotadas = anotarUnidades([u('1', 'sumido'), u('2', 'sumido'), u('3', 'pele')], catalogo)
    expect(anotadas.map((a) => [a.nome, a.anotacao, a.removido])).toEqual([
      ['Item removido', '1 de 2', true],
      ['Item removido', '2 de 2', true],
      ['Pele de Cervo', 'Animal', false],
    ])
  })

  it('aceita objetivo sem unidades', () => {
    expect(anotarUnidades([], catalogo)).toEqual([])
  })
})
