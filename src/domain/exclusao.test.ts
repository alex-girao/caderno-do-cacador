import { describe, expect, it } from 'vitest'
import {
  calcularImpactoExclusaoItem,
  listarNomes,
  removerItemDoObjetivo,
  textoConfirmacaoExclusaoItem,
  textoExclusaoBloqueada,
} from './exclusao.ts'
import { resumirObjetivo } from './status.ts'
import type { EstadoObjetivo, Unidade } from './tipos.ts'

const u = (id: string, itemId: string, obtido = false): Unidade => ({ id, itemId, obtido })

const aplicar = (objetivo: EstadoObjetivo, patch: Partial<EstadoObjetivo>): EstadoObjetivo => ({
  ...objetivo,
  ...patch,
})

describe('removerItemDoObjetivo', () => {
  const bolsa: EstadoObjetivo = {
    finalizado: false,
    unidades: [u('1', 'pele', true), u('2', 'pena'), u('3', 'lobo'), u('4', 'pena', true), u('5', 'pena')],
  }

  it('remove todas as unidades do item, obtidas ou não, e recalcula itemIds (RN21)', () => {
    expect(removerItemDoObjetivo(bolsa, 'pena')).toEqual({
      unidades: [u('1', 'pele', true), u('3', 'lobo')],
      itemIds: ['pele', 'lobo'],
    })
  })

  it('devolve null quando o objetivo não usa o item', () => {
    expect(removerItemDoObjetivo(bolsa, 'dente')).toBeNull()
  })

  it('não altera o objetivo original', () => {
    removerItemDoObjetivo(bolsa, 'pena')
    expect(bolsa.unidades).toHaveLength(5)
  })

  it('pode deixar o objetivo sem itens, Aguardando e com aviso', () => {
    const tenda: EstadoObjetivo = { finalizado: false, unidades: [u('1', 'dente', true), u('2', 'dente')] }
    const patch = removerItemDoObjetivo(tenda, 'dente')!
    expect(patch).toEqual({ unidades: [], itemIds: [] })
    expect(resumirObjetivo(aplicar(tenda, patch))).toMatchObject({
      status: 'Aguardando',
      semItens: true,
      avisoSemItens: true,
    })
  })

  it('pode levar Buscando a Obtido ao remover as únicas unidades pendentes', () => {
    const buscando: EstadoObjetivo = { finalizado: false, unidades: [u('1', 'pele', true), u('2', 'pena')] }
    const patch = removerItemDoObjetivo(buscando, 'pena')!
    expect(resumirObjetivo(aplicar(buscando, patch)).status).toBe('Obtido')
  })

  it('pode levar Buscando a Aguardando ao remover as únicas unidades obtidas', () => {
    const buscando: EstadoObjetivo = { finalizado: false, unidades: [u('1', 'pele', true), u('2', 'pena')] }
    const patch = removerItemDoObjetivo(buscando, 'pele')!
    expect(resumirObjetivo(aplicar(buscando, patch)).status).toBe('Aguardando')
  })

  it('não toca em finalizado: o objetivo esvaziado continua Finalizado, sem aviso', () => {
    const finalizado: EstadoObjetivo = { finalizado: true, unidades: [u('1', 'pena', true)] }
    const patch = removerItemDoObjetivo(finalizado, 'pena')!
    expect(patch).not.toHaveProperty('finalizado')
    expect(resumirObjetivo(aplicar(finalizado, patch))).toMatchObject({
      status: 'Finalizado',
      semItens: true,
      avisoSemItens: false,
    })
  })
})

describe('calcularImpactoExclusaoItem', () => {
  const objetivos: EstadoObjetivo[] = [
    { finalizado: false, unidades: [u('1', 'pena'), u('2', 'pena'), u('3', 'pele')] },
    { finalizado: false, unidades: [u('4', 'pena', true)] },
    { finalizado: true, unidades: [u('5', 'pena', true), u('6', 'pena', true)] },
    { finalizado: false, unidades: [u('7', 'lobo')] },
  ]

  it('conta objetivos afetados, unidades removidas e objetivos esvaziados', () => {
    expect(calcularImpactoExclusaoItem(objetivos, 'pena')).toEqual({
      objetivos: 3,
      unidades: 5,
      esvaziados: 2,
    })
  })

  it('é zero quando nenhum objetivo usa o item', () => {
    expect(calcularImpactoExclusaoItem(objetivos, 'dente')).toEqual({
      objetivos: 0,
      unidades: 0,
      esvaziados: 0,
    })
  })

  it('não conta como esvaziado um objetivo que já estava sem itens', () => {
    expect(calcularImpactoExclusaoItem([{ finalizado: false, unidades: [] }], 'pena').esvaziados).toBe(0)
  })
})

describe('textoConfirmacaoExclusaoItem', () => {
  it('informa unidades e objetivos afetados (RN21)', () => {
    expect(
      textoConfirmacaoExclusaoItem('Pele de Cervo', { objetivos: 2, unidades: 4, esvaziados: 0 }),
    ).toBe('Excluir Pele de Cervo também remove 4 unidades em 2 objetivos.')
  })

  it('usa o singular', () => {
    expect(textoConfirmacaoExclusaoItem('Pena de Ganso', { objetivos: 1, unidades: 1, esvaziados: 0 })).toBe(
      'Excluir Pena de Ganso também remove 1 unidade em 1 objetivo.',
    )
  })

  it('avisa quantos objetivos ficarão sem itens', () => {
    expect(textoConfirmacaoExclusaoItem('Dente de Ouro', { objetivos: 2, unidades: 3, esvaziados: 1 })).toBe(
      'Excluir Dente de Ouro também remove 3 unidades em 2 objetivos. 1 objetivo ficará sem itens.',
    )
    expect(textoConfirmacaoExclusaoItem('Dente de Ouro', { objetivos: 2, unidades: 3, esvaziados: 2 })).toBe(
      'Excluir Dente de Ouro também remove 3 unidades em 2 objetivos. 2 objetivos ficarão sem itens.',
    )
  })

  it('confirma mesmo quando o item não está em uso', () => {
    expect(textoConfirmacaoExclusaoItem('Pena de Garça', { objetivos: 0, unidades: 0, esvaziados: 0 })).toBe(
      'Excluir Pena de Garça? O item não está em nenhum objetivo.',
    )
  })
})

describe('listarNomes', () => {
  it.each([
    [[], ''],
    [['Bolsa'], 'Bolsa'],
    [['Bolsa', 'Tenda'], 'Bolsa e Tenda'],
    [['A', 'B', 'C'], 'A, B e C'],
    [['A', 'B', 'C', 'D', 'E'], 'A, B, C, D e E'],
    [['A', 'B', 'C', 'D', 'E', 'F', 'G'], 'A, B, C, D, E e mais 2'],
  ])('%j → %s', (nomes, esperado) => {
    expect(listarNomes(nomes)).toBe(esperado)
  })
})

describe('textoExclusaoBloqueada', () => {
  it('lista os itens que usam a origem (RN22)', () => {
    expect(textoExclusaoBloqueada('origem', 'Animal', ['Pena de Ganso', 'Pele de Cervo', 'Carcaça de Lobo'])).toBe(
      'Animal está em uso por 3 itens: Pena de Ganso, Pele de Cervo e Carcaça de Lobo. ' +
        'Altere a origem desses itens antes de excluí-la.',
    )
  })

  it('lista os objetivos que usam a finalidade, no singular (RN22)', () => {
    expect(textoExclusaoBloqueada('finalidade', 'Bolsa', ['Bolsa do Caçador Lendário'])).toBe(
      'Bolsa está em uso por 1 objetivo: Bolsa do Caçador Lendário. ' +
        'Altere a finalidade desse objetivo antes de excluí-la.',
    )
  })
})
