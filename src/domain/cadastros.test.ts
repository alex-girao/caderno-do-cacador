import { describe, expect, it } from 'vitest'
import { aparaNome, chaveDoNome, ordenarPorNome, validarNome } from './cadastros.ts'

describe('aparaNome', () => {
  it('remove espaços nas pontas', () => {
    expect(aparaNome('  Pena de Ganso \n')).toBe('Pena de Ganso')
  })

  it('reduz espaços repetidos a um, inclusive tabulações e quebras', () => {
    expect(aparaNome('Pena   de\t\nGanso')).toBe('Pena de Ganso')
  })

  it('preserva caixa e acentos', () => {
    expect(aparaNome(' Carcaça  de LOBO ')).toBe('Carcaça de LOBO')
  })
})

describe('chaveDoNome', () => {
  it.each([
    ['Pena de Ganso', 'PENA DE GANSO'],
    ['Carcaça', 'carcaca'],
    ['Pássaro', 'passaro'],
    ['Missão', 'MISSAO'],
    ['  Pele de Cervo  ', 'Pele de Cervo'],
    ['Pele   de\tCervo', 'pele de cervo'],
  ])('trata "%s" e "%s" como o mesmo nome', (a, b) => {
    expect(chaveDoNome(a)).toBe(chaveDoNome(b))
  })

  it('distingue nomes realmente diferentes', () => {
    expect(chaveDoNome('Pena de Ganso')).not.toBe(chaveDoNome('Pena de Garça'))
    expect(chaveDoNome('Peledecervo')).not.toBe(chaveDoNome('Pele de Cervo'))
  })
})

describe('validarNome', () => {
  const origens = [
    { id: 'o1', nome: 'Animal' },
    { id: 'o2', nome: 'Objeto' },
  ]

  it('devolve o nome com espaços normalizados, como será salvo (RN27)', () => {
    expect(validarNome('  Pena   de  Garça ', origens, { tipo: 'origem' })).toEqual({
      valido: true,
      nome: 'Pena de Garça',
    })
  })

  it('devolve o nome aparado quando é válido', () => {
    expect(validarNome('  Planta ', origens, { tipo: 'origem' })).toEqual({
      valido: true,
      nome: 'Planta',
    })
  })

  it.each(['', '   ', '\t\n'])('exige o nome (%j)', (nome) => {
    expect(validarNome(nome, origens, { tipo: 'origem' })).toEqual({
      valido: false,
      erro: 'Informe o nome.',
    })
  })

  it('bloqueia nome duplicado citando o registro existente (RN27)', () => {
    expect(validarNome('  aNiMaL ', origens, { tipo: 'origem' })).toEqual({
      valido: false,
      erro: 'Já existe uma origem chamada Animal.',
    })
  })

  it('bloqueia duplicado que difere só em acentos e espaços repetidos', () => {
    const itens = [{ id: 'i1', nome: 'Carcaça de Lobo' }]
    expect(validarNome('carcaca  de   lobo', itens, { tipo: 'item' })).toEqual({
      valido: false,
      erro: 'Já existe um item chamado Carcaça de Lobo.',
    })
  })

  it('usa a concordância de cada cadastro', () => {
    const finalidades = [{ id: 'f1', nome: 'Bolsa' }]
    expect(validarNome('bolsa', finalidades, { tipo: 'finalidade' })).toEqual({
      valido: false,
      erro: 'Já existe uma finalidade chamada Bolsa.',
    })
  })

  it('na edição, ignora o próprio registro para corrigir caixa ou acento', () => {
    const itens = [{ id: 'i1', nome: 'carcaca de lobo' }]
    expect(validarNome('Carcaça de Lobo', itens, { tipo: 'item', idAtual: 'i1' })).toEqual({
      valido: true,
      nome: 'Carcaça de Lobo',
    })
  })

  it('na edição, ainda bloqueia o nome de outro registro', () => {
    expect(validarNome('objeto', origens, { tipo: 'origem', idAtual: 'o1' })).toEqual({
      valido: false,
      erro: 'Já existe uma origem chamada Objeto.',
    })
  })

  it('aceita qualquer nome numa coleção vazia', () => {
    expect(validarNome('Animal', [], { tipo: 'origem' })).toEqual({ valido: true, nome: 'Animal' })
  })
})

describe('ordenarPorNome', () => {
  it('ordena em pt-BR, sem diferença de caixa e acentos, e não altera a original', () => {
    const lista = [{ nome: 'objeto' }, { nome: 'Ânimo' }, { nome: 'Animal' }, { nome: 'Érva' }, { nome: 'Dente' }]
    expect(ordenarPorNome(lista).map((r) => r.nome)).toEqual(['Animal', 'Ânimo', 'Dente', 'Érva', 'objeto'])
    expect(lista[0].nome).toBe('objeto')
  })

  it('ordena números pelo valor', () => {
    const lista = [{ nome: 'Tônico 10' }, { nome: 'Tônico 2' }]
    expect(ordenarPorNome(lista).map((r) => r.nome)).toEqual(['Tônico 2', 'Tônico 10'])
  })
})
