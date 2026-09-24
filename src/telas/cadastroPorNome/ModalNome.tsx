import { useState } from 'react'
import { validarNome } from '../../domain/cadastros.ts'
import type { RegistroPorNome } from '../../dados/cadastroPorNome.ts'
import { Campo } from '../../ui/Campo.tsx'
import { ModalFormulario } from '../../ui/ModalFormulario.tsx'
import type { ConfigCadastroPorNome } from './TelaCadastroPorNome.tsx'

interface Props {
  config: ConfigCadastroPorNome
  /** Registro em edição; ausente na criação. */
  registro?: RegistroPorNome
  existentes: RegistroPorNome[]
  salvar: (nome: string) => Promise<void>
  aoFechar: () => void
}

export function ModalNome({ config, registro, existentes, salvar, aoFechar }: Props) {
  const [nome, setNome] = useState(registro?.nome ?? '')
  const validar = () => validarNome(nome, existentes, { tipo: config.tipo, idAtual: registro?.id })

  return (
    <ModalFormulario
      titulo={registro ? config.tituloEditar : config.tituloNovo}
      aoFechar={aoFechar}
      validar={() => {
        const resultado = validar()
        return resultado.valido ? null : resultado.erro
      }}
      salvar={async () => {
        const resultado = validar()
        if (resultado.valido) await salvar(resultado.nome)
      }}
    >
      <Campo
        rotulo="Nome"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder={config.exemplo}
        autoFocus
        autoComplete="off"
        required
      />
    </ModalFormulario>
  )
}
