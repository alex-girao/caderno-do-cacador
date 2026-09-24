import { useOrigens } from '../../dados/hooks.ts'
import { origens } from '../../dados/origens.ts'
import { TelaCadastroPorNome, type ConfigCadastroPorNome } from '../cadastroPorNome/TelaCadastroPorNome.tsx'

const config: ConfigCadastroPorNome = {
  tipo: 'origem',
  titulo: 'Origens',
  singular: 'origem',
  plural: 'origens',
  tituloNovo: 'Nova origem',
  tituloEditar: 'Editar origem',
  tituloExcluir: 'Excluir origem',
  tituloEmUso: 'Origem em uso',
  exemplo: 'Animal',
  vazio: 'Nenhuma origem no caderno. Cadastre a primeira, como Animal ou Objeto.',
  useLista: useOrigens,
  dados: origens,
}

export function TelaOrigens() {
  return <TelaCadastroPorNome config={config} />
}
