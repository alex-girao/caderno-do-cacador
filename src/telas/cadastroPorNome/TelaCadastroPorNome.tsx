import { useState } from 'react'
import { useUid } from '../../app/SessaoContext.tsx'
import type { criarCadastroPorNome, RegistroPorNome } from '../../dados/cadastroPorNome.ts'
import type { EstadoLista } from '../../dados/useAssinatura.ts'
import { ordenarPorNome } from '../../domain/cadastros.ts'
import { quantificar } from '../../domain/texto.ts'
import { Botao } from '../../ui/Botao.tsx'
import { CabecalhoTela } from '../../ui/CabecalhoTela.tsx'
import { ListaCadastro } from '../../ui/ListaCadastro.tsx'
import { ModalNome } from './ModalNome.tsx'

/** O que muda entre os cadastros de Origem e de Finalidade. */
export interface ConfigCadastroPorNome {
  tipo: 'origem' | 'finalidade'
  titulo: string
  singular: string
  plural: string
  tituloNovo: string
  tituloEditar: string
  exemplo: string
  vazio: string
  useLista: () => EstadoLista<RegistroPorNome>
  dados: ReturnType<typeof criarCadastroPorNome>
}

type Edicao = { modo: 'novo' } | { modo: 'editar'; registro: RegistroPorNome } | null

export function TelaCadastroPorNome({ config }: { config: ConfigCadastroPorNome }) {
  const uid = useUid()
  const lista = config.useLista()
  const [edicao, setEdicao] = useState<Edicao>(null)
  const registros = lista.estado === 'pronta' ? lista.registros : []

  return (
    <>
      <CabecalhoTela
        titulo={config.titulo}
        detalhe={lista.estado === 'pronta' ? quantificar(registros.length, config.singular, config.plural) : undefined}
        acao={
          <Botao variante="primario" onClick={() => setEdicao({ modo: 'novo' })}>
            {config.tituloNovo}
          </Botao>
        }
      />
      <ListaCadastro
        lista={lista}
        linhas={(rs) => ordenarPorNome(rs)}
        vazio={config.vazio}
        acoes={(linha) => (
          <Botao
            variante="texto"
            aria-label={`Editar ${linha.nome}`}
            onClick={() => setEdicao({ modo: 'editar', registro: registros.find((r) => r.id === linha.id)! })}
          >
            Editar
          </Botao>
        )}
      />
      {edicao && (
        <ModalNome
          config={config}
          registro={edicao.modo === 'editar' ? edicao.registro : undefined}
          existentes={registros}
          salvar={async (nome) => {
            if (edicao.modo === 'editar') await config.dados.renomear(uid, edicao.registro.id, nome)
            else await config.dados.criar(uid, nome)
          }}
          aoFechar={() => setEdicao(null)}
        />
      )}
    </>
  )
}
