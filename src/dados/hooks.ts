import { finalidades } from './finalidades.ts'
import { itens } from './itens.ts'
import { origens } from './origens.ts'
import { useAssinatura } from './useAssinatura.ts'

export const useOrigens = () => useAssinatura(origens.assinar)
export const useFinalidades = () => useAssinatura(finalidades.assinar)
export const useItens = () => useAssinatura(itens.assinar)
