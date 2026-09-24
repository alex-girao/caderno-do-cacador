import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { Botao } from './Botao.tsx'
import { MensagemErro } from './MensagemErro.tsx'
import { Modal } from './Modal.tsx'

interface Props {
  titulo: string
  aoFechar: () => void
  /** Devolve a mensagem de erro de validação, ou null se estiver tudo certo. */
  validar: () => string | null
  /** Grava os dados. O modal fecha quando a gravação termina. */
  salvar: () => Promise<void>
  /** Desabilita o Salvar, por exemplo quando falta um cadastro de apoio. */
  bloqueado?: boolean
  children: ReactNode
}

/** Modal de criação e edição comum a todos os cadastros. */
export function ModalFormulario({ titulo, aoFechar, validar, salvar, bloqueado, children }: Props) {
  const idFormulario = useId()
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    const erroValidacao = validar()
    setErro(erroValidacao)
    if (erroValidacao) return
    setSalvando(true)
    try {
      await salvar()
      aoFechar()
    } catch {
      setErro('Não foi possível salvar. Verifique a conexão e tente de novo.')
      setSalvando(false)
    }
  }

  return (
    <Modal
      titulo={titulo}
      aoFechar={aoFechar}
      rodape={
        <>
          <Botao onClick={aoFechar}>Cancelar</Botao>
          <Botao
            variante="primario"
            type="submit"
            form={idFormulario}
            disabled={salvando || bloqueado}
          >
            {salvando ? 'Salvando' : 'Salvar'}
          </Botao>
        </>
      }
    >
      <form id={idFormulario} onSubmit={enviar} noValidate style={{ display: 'contents' }}>
        {children}
      </form>
      <MensagemErro>{erro}</MensagemErro>
    </Modal>
  )
}
