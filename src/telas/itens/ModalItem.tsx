import { useState } from 'react'
import type { RegistroPorNome } from '../../dados/cadastroPorNome.ts'
import type { DadosItem } from '../../dados/itens.ts'
import { ordenarPorNome, validarNome } from '../../domain/cadastros.ts'
import type { Item } from '../../domain/tipos.ts'
import { Campo, Selecao } from '../../ui/Campo.tsx'
import { ModalFormulario } from '../../ui/ModalFormulario.tsx'

interface Props {
  /** Item em edição; ausente na criação. */
  item?: Item
  existentes: Item[]
  origens: RegistroPorNome[]
  salvar: (dados: DadosItem) => Promise<void>
  aoFechar: () => void
}

export function ModalItem({ item, existentes, origens, salvar, aoFechar }: Props) {
  const [nome, setNome] = useState(item?.nome ?? '')
  const [origemId, setOrigemId] = useState(item?.origemId ?? '')
  const semOrigens = origens.length === 0

  function validar() {
    const resultado = validarNome(nome, existentes, { tipo: 'item', idAtual: item?.id })
    if (!resultado.valido) return resultado
    if (!origens.some((o) => o.id === origemId)) {
      return { valido: false as const, erro: 'Escolha a origem do item.' }
    }
    return resultado
  }

  return (
    <ModalFormulario
      titulo={item ? 'Editar item' : 'Novo item'}
      aoFechar={aoFechar}
      bloqueado={semOrigens}
      validar={() => {
        const resultado = validar()
        return resultado.valido ? null : resultado.erro
      }}
      salvar={async () => {
        const resultado = validar()
        if (resultado.valido) await salvar({ nome: resultado.nome, origemId })
      }}
    >
      <Campo
        rotulo="Nome"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="Pena de Ganso"
        autoFocus
        autoComplete="off"
        required
      />
      {semOrigens ? (
        <p className="t-corpo">
          Cadastre uma origem antes de criar itens. <a href="#origens">Ir para Origens</a>
        </p>
      ) : (
        <Selecao
          rotulo="Origem"
          value={origemId}
          onChange={(e) => setOrigemId(e.target.value)}
          required
        >
          <option value="" disabled>
            Escolha a origem
          </option>
          {ordenarPorNome(origens).map((o) => (
            <option key={o.id} value={o.id}>
              {o.nome}
            </option>
          ))}
        </Selecao>
      )}
    </ModalFormulario>
  )
}
