import { describe, expect, it } from 'vitest'
import { calcularStatus, resumirObjetivo } from './status.ts'
import type { EstadoObjetivo, Unidade } from './tipos.ts'

const un = (...obtidos: boolean[]): Unidade[] =>
  obtidos.map((obtido, i) => ({ id: `u${i}`, itemId: 'pena', obtido }))

const estado = (unidades: Unidade[], finalizado = false): EstadoObjetivo => ({ unidades, finalizado })

describe('calcularStatus', () => {
  it('é Aguardando quando nenhuma unidade foi obtida', () => {
    expect(calcularStatus(estado(un(false)))).toBe('Aguardando')
    expect(calcularStatus(estado(un(false, false, false)))).toBe('Aguardando')
  })

  it('é Buscando com pelo menos uma unidade obtida', () => {
    expect(calcularStatus(estado(un(true, false)))).toBe('Buscando')
    expect(calcularStatus(estado(un(false, false, true)))).toBe('Buscando')
  })

  it('é Obtido com todas as unidades obtidas', () => {
    expect(calcularStatus(estado(un(true)))).toBe('Obtido')
    expect(calcularStatus(estado(un(true, true, true)))).toBe('Obtido')
  })

  it('é Finalizado quando finalizado = true, com precedência sobre as unidades', () => {
    expect(calcularStatus(estado(un(true, true), true))).toBe('Finalizado')
    expect(calcularStatus(estado(un(true, false), true))).toBe('Finalizado')
    expect(calcularStatus(estado(un(false), true))).toBe('Finalizado')
  })

  it('é Aguardando quando o objetivo está sem itens, e não Obtido', () => {
    expect(calcularStatus(estado([]))).toBe('Aguardando')
  })

  it('mantém Finalizado para um objetivo finalizado que ficou sem itens', () => {
    expect(calcularStatus(estado([], true))).toBe('Finalizado')
  })
})

describe('resumirObjetivo', () => {
  it('conta unidades obtidas e totais', () => {
    expect(resumirObjetivo(estado(un(true, false, true)))).toMatchObject({ obtidas: 2, total: 3 })
  })

  it('libera Finalizado apenas em Obtido (RN11)', () => {
    expect(resumirObjetivo(estado(un(true, true))).podeFinalizar).toBe(true)
    expect(resumirObjetivo(estado(un(true, false))).podeFinalizar).toBe(false)
    expect(resumirObjetivo(estado(un(false))).podeFinalizar).toBe(false)
    expect(resumirObjetivo(estado(un(true), true)).podeFinalizar).toBe(false)
  })

  it('libera Reverter apenas em Finalizado (RN13)', () => {
    expect(resumirObjetivo(estado(un(true), true)).podeReverter).toBe(true)
    expect(resumirObjetivo(estado(un(true))).podeReverter).toBe(false)
  })

  it('trava as marcações em objetivos finalizados (RN14)', () => {
    expect(resumirObjetivo(estado(un(true), true)).podeMarcar).toBe(false)
    expect(resumirObjetivo(estado(un(true))).podeMarcar).toBe(true)
  })

  it('sinaliza objetivo sem itens como Aguardando e sem Finalizado', () => {
    expect(resumirObjetivo(estado([]))).toEqual({
      status: 'Aguardando',
      obtidas: 0,
      total: 0,
      semItens: true,
      podeMarcar: true,
      podeFinalizar: false,
      podeReverter: false,
    })
  })

  it('não sinaliza sem itens quando há unidades', () => {
    expect(resumirObjetivo(estado(un(false))).semItens).toBe(false)
  })
})
