// Regras comuns aos cadastros de Finalidade, Origem e Item (seção 4).

interface ComNome {
  id: string
  nome: string
}

/** Nome como será salvo: sem espaços nas pontas e com espaços repetidos reduzidos a um. */
export function aparaNome(nome: string): string {
  return nome.trim().replace(/\s+/g, ' ')
}

/**
 * Forma usada para comparar nomes (RN27): o nome aparado, sem diferença
 * de maiúsculas, minúsculas e acentos.
 */
export function chaveDoNome(nome: string): string {
  return aparaNome(nome)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('pt-BR')
}

export type TipoCadastro = 'finalidade' | 'origem' | 'item'

const CHAMADO: Record<TipoCadastro, string> = {
  finalidade: 'uma finalidade chamada',
  origem: 'uma origem chamada',
  item: 'um item chamado',
}

export interface OpcoesValidacaoNome {
  tipo: TipoCadastro
  /** Na edição, o id do próprio registro, que não conta como duplicado. */
  idAtual?: string
}

export type ResultadoNome = { valido: true; nome: string } | { valido: false; erro: string }

/** Nome obrigatório e único dentro da coleção (RN01 a RN03, RN27). */
export function validarNome(
  nome: string,
  existentes: readonly ComNome[],
  { tipo, idAtual }: OpcoesValidacaoNome,
): ResultadoNome {
  const aparado = aparaNome(nome)
  if (!aparado) return { valido: false, erro: 'Informe o nome.' }
  const chave = chaveDoNome(aparado)
  const duplicado = existentes.find((r) => r.id !== idAtual && chaveDoNome(r.nome) === chave)
  if (duplicado) {
    return { valido: false, erro: `Já existe ${CHAMADO[tipo]} ${duplicado.nome}.` }
  }
  return { valido: true, nome: aparado }
}

const colacao = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true })

/** Nova lista em ordem alfabética, sem diferença de caixa e acentos. */
export function ordenarPorNome<T extends Pick<ComNome, 'nome'>>(registros: readonly T[]): T[] {
  return [...registros].sort((a, b) => colacao.compare(a.nome, b.nome))
}
