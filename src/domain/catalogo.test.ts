import { describe, expect, it } from 'vitest'
import { filtrarCatalogo } from './catalogo.ts'

const itens = [
  { id: 'i1', nome: 'Pena de Ganso', origemId: 'animal' },
  { id: 'i2', nome: 'Carcaça de Lobo', origemId: 'animal' },
  { id: 'i3', nome: 'Dente de Ouro', origemId: 'objeto' },
  { id: 'i4', nome: 'Pele de Cervo', origemId: 'animal' },
  { id: 'i5', nome: 'Ginseng Americano', origemId: 'planta' },
]

const nomes = (lista: typeof itens) => lista.map((i) => i.nome)

describe('filtrarCatalogo', () => {
  it('sem filtros, devolve todos em ordem alfabética', () => {
    expect(nomes(filtrarCatalogo(itens, { texto: '', origemId: '' }))).toEqual([
      'Carcaça de Lobo',
      'Dente de Ouro',
      'Ginseng Americano',
      'Pele de Cervo',
      'Pena de Ganso',
    ])
  })

  it('filtra por trecho do nome sem diferença de caixa, acentos e espaços (RN05)', () => {
    expect(nomes(filtrarCatalogo(itens, { texto: 'pe', origemId: '' }))).toEqual(['Pele de Cervo', 'Pena de Ganso'])
    expect(nomes(filtrarCatalogo(itens, { texto: '  CARCACA ', origemId: '' }))).toEqual(['Carcaça de Lobo'])
    expect(nomes(filtrarCatalogo(itens, { texto: 'de   ouro', origemId: '' }))).toEqual(['Dente de Ouro'])
  })

  it('filtra por origem (RN05)', () => {
    expect(nomes(filtrarCatalogo(itens, { texto: '', origemId: 'objeto' }))).toEqual(['Dente de Ouro'])
  })

  it('combina nome e origem', () => {
    expect(nomes(filtrarCatalogo(itens, { texto: 'de', origemId: 'animal' }))).toEqual([
      'Carcaça de Lobo',
      'Pele de Cervo',
      'Pena de Ganso',
    ])
  })

  it('omite itens já presentes no objetivo', () => {
    const excluir = new Set(['i1', 'i4'])
    expect(nomes(filtrarCatalogo(itens, { texto: 'pe', origemId: '', excluir }))).toEqual([])
  })

  it('devolve vazio quando nada atende', () => {
    expect(filtrarCatalogo(itens, { texto: 'xyz', origemId: '' })).toEqual([])
  })
})
