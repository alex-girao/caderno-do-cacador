import { describe, expect, it } from 'vitest'
import {
  linhasDoObjetivo,
  MENSAGEM_ULTIMA_UNIDADE,
  mensagemReferenciasInexistentes,
  montarPatchEdicao,
  ReferenciasInexistentes,
  reconciliarUnidades,
  textoObtidasDaLinha,
  validarFormularioObjetivo,
} from './edicaoObjetivo.ts'
import { calcularStatus } from './status.ts'
import { ErroDeDominio, type EstadoObjetivo, type Unidade } from './tipos.ts'

const u = (id: string, itemId: string, obtido = false): Unidade => ({ id, itemId, obtido })

const sequencial = () => {
  let n = 0
  return () => `n${++n}`
}

const aplicar = (objetivo: EstadoObjetivo, patch: Partial<EstadoObjetivo>): EstadoObjetivo => ({
  finalizado: patch.finalizado ?? objetivo.finalizado,
  unidades: patch.unidades ?? objetivo.unidades,
})

const ids = (unidades: Unidade[]) => unidades.map((x) => x.id)

describe('linhasDoObjetivo', () => {
  it('agrupa por item na ordem de primeira aparição, contando obtidas', () => {
    const unidades = [u('1', 'pele', true), u('2', 'pena'), u('3', 'lobo'), u('4', 'pena', true), u('5', 'pena')]
    expect(linhasDoObjetivo(unidades)).toEqual([
      { itemId: 'pele', quantidade: 1, obtidas: 1 },
      { itemId: 'pena', quantidade: 3, obtidas: 1 },
      { itemId: 'lobo', quantidade: 1, obtidas: 0 },
    ])
  })

  it('é vazio para objetivo sem itens', () => {
    expect(linhasDoObjetivo([])).toEqual([])
  })
})

describe('reconciliarUnidades', () => {
  const atuais = [u('1', 'pena', false), u('2', 'pena', true), u('3', 'pena', false), u('4', 'pele', true)]

  it('mantém tudo quando as quantidades não mudam', () => {
    const linhas = [
      { itemId: 'pena', quantidade: 3 },
      { itemId: 'pele', quantidade: 1 },
    ]
    expect(reconciliarUnidades(atuais, linhas)).toEqual(atuais)
  })

  it('ao aumentar, acrescenta unidades não obtidas logo após as do mesmo item', () => {
    const linhas = [
      { itemId: 'pena', quantidade: 5 },
      { itemId: 'pele', quantidade: 1 },
    ]
    const resultado = reconciliarUnidades(atuais, linhas, sequencial())
    expect(resultado).toEqual([...atuais.slice(0, 3), u('n1', 'pena'), u('n2', 'pena'), atuais[3]])
  })

  it('ao reduzir, remove primeiro as não obtidas, das últimas para as primeiras (RN08)', () => {
    const linhas = [
      { itemId: 'pena', quantidade: 2 },
      { itemId: 'pele', quantidade: 1 },
    ]
    expect(ids(reconciliarUnidades(atuais, linhas))).toEqual(['1', '2', '4'])
    const paraUma = [
      { itemId: 'pena', quantidade: 1 },
      { itemId: 'pele', quantidade: 1 },
    ]
    expect(ids(reconciliarUnidades(atuais, paraUma))).toEqual(['2', '4'])
  })

  it('só remove obtidas quando não restam pendentes, e das últimas para as primeiras', () => {
    const todasObtidas = [u('1', 'pena', true), u('2', 'pena', true), u('3', 'pena', true)]
    expect(ids(reconciliarUnidades(todasObtidas, [{ itemId: 'pena', quantidade: 1 }]))).toEqual(['1'])
    const mistas = [u('1', 'pena', true), u('2', 'pena', false), u('3', 'pena', true)]
    expect(ids(reconciliarUnidades(mistas, [{ itemId: 'pena', quantidade: 1 }]))).toEqual(['1'])
  })

  it('remove todas as unidades de um item retirado das linhas', () => {
    expect(ids(reconciliarUnidades(atuais, [{ itemId: 'pele', quantidade: 1 }]))).toEqual(['4'])
  })

  it('cria as unidades de um item novo, e segue a ordem das linhas', () => {
    const linhas = [
      { itemId: 'dente', quantidade: 2 },
      { itemId: 'pele', quantidade: 1 },
    ]
    expect(reconciliarUnidades(atuais, linhas, sequencial())).toEqual([u('n1', 'dente'), u('n2', 'dente'), atuais[3]])
  })

  it('preserva o id e o estado das unidades mantidas', () => {
    const resultado = reconciliarUnidades(atuais, [{ itemId: 'pena', quantidade: 3 }])
    expect(resultado.map((x) => x.obtido)).toEqual([false, true, false])
  })

  it.each([0, -1, 1.5])('rejeita quantidade %s', (quantidade) => {
    expect(() => reconciliarUnidades(atuais, [{ itemId: 'pena', quantidade }])).toThrow(ErroDeDominio)
  })

  it('rejeita item repetido nas linhas', () => {
    const linhas = [
      { itemId: 'pena', quantidade: 1 },
      { itemId: 'pena', quantidade: 2 },
    ]
    expect(() => reconciliarUnidades(atuais, linhas)).toThrow(ErroDeDominio)
  })
})

describe('textoObtidasDaLinha', () => {
  it.each([
    [{ itemId: 'x', quantidade: 1, obtidas: 0 }, 'nenhuma obtida'],
    [{ itemId: 'x', quantidade: 1, obtidas: 1 }, '1 obtida'],
    [{ itemId: 'x', quantidade: 3, obtidas: 1 }, '1 de 3 obtida'],
    [{ itemId: 'x', quantidade: 3, obtidas: 2 }, '2 de 3 obtidas'],
    [{ itemId: 'x', quantidade: 2, obtidas: 3 }, '2 de 2 obtidas; 1 obtida será removida'],
    [{ itemId: 'x', quantidade: 1, obtidas: 3 }, '1 obtida; 2 obtidas serão removidas'],
  ])('%j → %s', (linha, esperado) => {
    expect(textoObtidasDaLinha(linha)).toBe(esperado)
  })
})

describe('montarPatchEdicao', () => {
  const buscando: EstadoObjetivo = { finalizado: false, unidades: [u('1', 'pena', true), u('2', 'pena')] }

  it('recalcula itemIds e lista os itens das unidades novas', () => {
    const patch = montarPatchEdicao(
      buscando,
      [
        { itemId: 'pena', quantidade: 3 },
        { itemId: 'pele', quantidade: 1 },
      ],
      sequencial(),
    )
    expect(patch.itemIds).toEqual(['pena', 'pele'])
    expect(patch.itensNovos).toEqual(['pena', 'pele'])
    expect(patch).not.toHaveProperty('finalizado')
  })

  it('não lista itens novos quando só reduz ou mantém', () => {
    expect(montarPatchEdicao(buscando, [{ itemId: 'pena', quantidade: 1 }]).itensNovos).toEqual([])
  })

  it('reduzir preserva o progresso: Buscando pode virar Obtido (RN08)', () => {
    const patch = montarPatchEdicao(buscando, [{ itemId: 'pena', quantidade: 1 }])
    expect(calcularStatus(aplicar(buscando, patch))).toBe('Obtido')
  })

  it('em finalizado, adicionar unidade limpa finalizado e finalizadoEm (RN15)', () => {
    const finalizado: EstadoObjetivo = { finalizado: true, unidades: [u('1', 'pena', true)] }
    const patch = montarPatchEdicao(finalizado, [{ itemId: 'pena', quantidade: 2 }], sequencial())
    expect(patch.finalizado).toBe(false)
    expect(patch.finalizadoEm).toBeNull()
    expect(calcularStatus(aplicar(finalizado, patch))).toBe('Buscando')
  })

  it('em finalizado, reduzir ou manter não desfaz a conquista', () => {
    const finalizado: EstadoObjetivo = { finalizado: true, unidades: [u('1', 'pena', true), u('2', 'pele', true)] }
    const patch = montarPatchEdicao(finalizado, [{ itemId: 'pena', quantidade: 1 }])
    expect(patch).not.toHaveProperty('finalizado')
    expect(calcularStatus(aplicar(finalizado, patch))).toBe('Finalizado')
  })

  it('bloqueia a edição que remove todas as unidades de um objetivo com unidades (RN20)', () => {
    expect(() => montarPatchEdicao(buscando, [])).toThrow(MENSAGEM_ULTIMA_UNIDADE)
  })

  it.each([
    ['não finalizado', false, 'Aguardando'],
    ['finalizado', true, 'Finalizado'],
  ])('renomear um objetivo vazio %s mantém o status (RN20)', (_rotulo, finalizado, status) => {
    const vazio: EstadoObjetivo = { finalizado, unidades: [] }
    const patch = montarPatchEdicao(vazio, [])
    expect(patch).toEqual({ unidades: [], itemIds: [], itensNovos: [] })
    expect(calcularStatus(aplicar(vazio, patch))).toBe(status)
  })

  it('objetivo vazio e finalizado que recebe itens volta a Aguardando (RN15)', () => {
    const vazio: EstadoObjetivo = { finalizado: true, unidades: [] }
    const patch = montarPatchEdicao(vazio, [{ itemId: 'pena', quantidade: 1 }], sequencial())
    expect(patch).toMatchObject({ finalizado: false, finalizadoEm: null, itensNovos: ['pena'] })
    expect(calcularStatus(aplicar(vazio, patch))).toBe('Aguardando')
  })
})

describe('unidades de item removido', () => {
  // "sumido" não existe mais no catálogo.
  const comOrfas: EstadoObjetivo = {
    finalizado: false,
    unidades: [u('1', 'sumido', true), u('2', 'sumido'), u('3', 'pena')],
  }

  it('podem ser retiradas na edição sem exigir a releitura do item', () => {
    const patch = montarPatchEdicao(comOrfas, [{ itemId: 'pena', quantidade: 1 }])
    expect(ids(patch.unidades)).toEqual(['3'])
    expect(patch.itemIds).toEqual(['pena'])
    expect(patch.itensNovos).toEqual([])
  })

  it('podem ser reduzidas, e mantidas, sem virar item novo', () => {
    const patch = montarPatchEdicao(comOrfas, [
      { itemId: 'sumido', quantidade: 1 },
      { itemId: 'pena', quantidade: 1 },
    ])
    expect(ids(patch.unidades)).toEqual(['1', '3'])
    expect(patch.itensNovos).toEqual([])
  })

  it('aumentar um item removido o lista como novo, para a transação recusar', () => {
    const patch = montarPatchEdicao(
      comOrfas,
      [
        { itemId: 'sumido', quantidade: 3 },
        { itemId: 'pena', quantidade: 1 },
      ],
      sequencial(),
    )
    expect(patch.itensNovos).toEqual(['sumido'])
  })
})

describe('mensagemReferenciasInexistentes', () => {
  const nomes = new Map([
    ['pena', 'Pena de Ganso'],
    ['dente', 'Dente de Ouro'],
  ])

  it('nomeia um item excluído', () => {
    expect(mensagemReferenciasInexistentes(new ReferenciasInexistentes(['pena'], false), nomes)).toBe(
      'Pena de Ganso foi excluído do catálogo enquanto você editava. Revise os itens e salve de novo.',
    )
  })

  it('nomeia vários itens excluídos', () => {
    expect(mensagemReferenciasInexistentes(new ReferenciasInexistentes(['pena', 'dente'], false), nomes)).toBe(
      'Pena de Ganso e Dente de Ouro foram excluídos do catálogo enquanto você editava. Revise os itens e salve de novo.',
    )
  })

  it('conta os itens quando algum nome é desconhecido', () => {
    expect(mensagemReferenciasInexistentes(new ReferenciasInexistentes(['x'], false), nomes)).toBe(
      'Um item foi excluído do catálogo enquanto você editava. Revise os itens e salve de novo.',
    )
    expect(mensagemReferenciasInexistentes(new ReferenciasInexistentes(['pena', 'x'], false), nomes)).toBe(
      '2 itens foram excluídos do catálogo enquanto você editava. Revise os itens e salve de novo.',
    )
  })

  it('avisa sobre a finalidade excluída, sozinha ou com itens', () => {
    expect(mensagemReferenciasInexistentes(new ReferenciasInexistentes([], true), nomes)).toBe(
      'A finalidade escolhida foi excluída enquanto você editava. Escolha outra e salve de novo.',
    )
    expect(mensagemReferenciasInexistentes(new ReferenciasInexistentes(['pena'], true), nomes)).toContain(
      'Pena de Ganso foi excluído do catálogo',
    )
  })

  it('é um ErroDeDominio', () => {
    expect(new ReferenciasInexistentes(['pena'], false)).toBeInstanceOf(ErroDeDominio)
  })
})

describe('validarFormularioObjetivo', () => {
  const valido = { nome: 'Bolsa do Caçador', finalidadeId: 'f1', linhas: [{ itemId: 'pena', quantidade: 1 }] }
  const criando = { criando: true, tinhaUnidades: false, finalidadeExiste: true }
  const editando = { criando: false, tinhaUnidades: true, finalidadeExiste: true }

  it('aceita um formulário completo', () => {
    expect(validarFormularioObjetivo(valido, criando)).toBeNull()
  })

  it('exige nome e finalidade', () => {
    expect(validarFormularioObjetivo({ ...valido, nome: '  ' }, criando)).toBe('Informe o nome.')
    expect(validarFormularioObjetivo({ ...valido, finalidadeId: '' }, criando)).toBe('Escolha a finalidade.')
    expect(validarFormularioObjetivo(valido, { ...criando, finalidadeExiste: false })).toBe('Escolha a finalidade.')
  })

  it('bloqueia a criação sem itens (RN04, RN07)', () => {
    expect(validarFormularioObjetivo({ ...valido, linhas: [] }, criando)).toBe('Adicione pelo menos um item.')
  })

  it('bloqueia esvaziar na edição um objetivo que tinha itens (RN20)', () => {
    expect(validarFormularioObjetivo({ ...valido, linhas: [] }, editando)).toBe(MENSAGEM_ULTIMA_UNIDADE)
  })

  it('permite salvar vazio um objetivo que já estava vazio (RN20)', () => {
    expect(validarFormularioObjetivo({ ...valido, linhas: [] }, { ...editando, tinhaUnidades: false })).toBeNull()
  })
})
