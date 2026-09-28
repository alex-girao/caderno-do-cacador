import { finalidades } from '../../dados/finalidades.ts'
import { useFinalidades } from '../../dados/hooks.ts'
import { TelaCadastroPorNome, type ConfigCadastroPorNome } from '../cadastroPorNome/TelaCadastroPorNome.tsx'

const config: ConfigCadastroPorNome = {
  tipo: 'finalidade',
  titulo: 'Finalidades',
  singular: 'finalidade',
  plural: 'finalidades',
  tituloNovo: 'Nova finalidade',
  tituloEditar: 'Editar finalidade',
  tituloExcluir: 'Excluir finalidade',
  tituloEmUso: 'Finalidade em uso',
  exemplo: 'Bolsa',
  vazio: 'Nenhuma finalidade no caderno. Cadastre a primeira, como Bolsa, Acampamento ou Missão.',
  useLista: useFinalidades,
  dados: finalidades,
}

export function TelaFinalidades() {
  return <TelaCadastroPorNome config={config} />
}
