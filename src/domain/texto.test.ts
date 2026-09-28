import { describe, expect, it } from 'vitest'
import { quantificar } from './texto.ts'

describe('quantificar', () => {
  it.each([
    [0, '0 origens'],
    [1, '1 origem'],
    [2, '2 origens'],
  ])('%i → %s', (n, esperado) => {
    expect(quantificar(n, 'origem', 'origens')).toBe(esperado)
  })
})
