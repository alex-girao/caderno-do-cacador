import { criarCadastroPorNome } from './cadastroPorNome.ts'
import { objetivos } from './objetivos.ts'

export const finalidades = criarCadastroPorNome('finalidades', async (uid, finalidadeId) =>
  (await objetivos.buscarPorFinalidade(uid, finalidadeId)).map((o) => o.nome),
)
