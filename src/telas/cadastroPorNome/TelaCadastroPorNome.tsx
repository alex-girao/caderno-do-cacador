import { useState } from 'react'
import { useUid } from '../../app/SessaoContext.tsx'
import type { CadastroPorNome, RegistroPorNome } from '../../dados/cadastroPorNome.ts'
import type { EstadoLista } from '../../dados/useAssinatura.ts'
import { ordenarPorNome } from '../../domain/cadastros.ts'
import { textoExclusaoBloqueada } from '../../domain/exclusao.ts'
import { quantificar } from '../../domain/texto.ts'
import { Botao } from '../../ui/Botao.tsx'
import { CabecalhoTela } from '../../ui/CabecalhoTela.tsx'
import { ListaCadastro } from '../../ui/ListaCadastro.tsx'
import { useExclusao } from '../../ui/useExclusao.ts'
import { ModalNome } from './ModalNome.tsx'

/** O que muda entre os cadastros de Origem e de Finalidade. */
export interface ConfigCadastroPorNome {
  tipo: 'origem' | 'finalidade'
  titulo: string
  singular: string
  plural: string
  tituloNovo: string
  tituloEditar: string
  tituloExcluir: string
  tituloEmUso: string
  exemplo: string
  vazio: string
  useLista: () => EstadoLista<RegistroPorNome>
  dados: CadastroPorNome
}

type Edicao = { modo: 'novo' } | { modo: 'editar'; registro: RegistroPorNome } | null

export function TelaCadastroPorNome({ config }: { config: ConfigCadastroPorNome }) {
  const uid = useUid()
  const lista = config.useLista()
  const [edicao, setEdicao] = useState<Edicao>(null)
  const registros = lista.estado === 'pronta' ? lista.registros : []
  const excluir = useExclusao()

  const registroPorId = (id: string) => registros.find((r) => r.id === id)!

  function aoExcluir(registro: RegistroPorNome) {
    excluir(async () => {
      const usos = await config.dados.buscarUsos(uid, registro.id)
      if (usos.length > 0) {
        const nomes = ordenarPorNome(usos.map((nome) => ({ nome }))).map((u) => u.nome)
        return {
          bloqueada: true,
          titulo: config.tituloEmUso,
          mensagem: textoExclusaoBloqueada(config.tipo, registro.nome, nomes),
        }
      }
      return {
        bloqueada: false,
        titulo: config.tituloExcluir,
        mensagem: `Excluir ${registro.nome}? Esta ação não pode ser desfeita.`,
        excluir: () => config.dados.excluir(uid, registro.id),
      }
    })
  }

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
          <>
            <Botao
              variante="texto"
              aria-label={`Editar ${linha.nome}`}
              onClick={() => setEdicao({ modo: 'editar', registro: registroPorId(linha.id) })}
            >
              Editar
            </Botao>
            <Botao
              variante="texto"
              aria-label={`Excluir ${linha.nome}`}
              onClick={() => aoExcluir(registroPorId(linha.id))}
            >
              Excluir
            </Botao>
          </>
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
