import { useMemo, useState, type ReactNode } from 'react'
import { useUid } from '../../app/SessaoContext.tsx'
import type { RegistroPorNome } from '../../dados/cadastroPorNome.ts'
import { objetivos as dadosObjetivos } from '../../dados/objetivos.ts'
import type { ItemDoCatalogo } from '../../domain/apresentacao.ts'
import { ordenarPorNome } from '../../domain/cadastros.ts'
import { linhasDoObjetivo, validarFormularioObjetivo, type LinhaItem } from '../../domain/edicaoObjetivo.ts'
import type { Item, Objetivo } from '../../domain/tipos.ts'
import { Campo, Selecao } from '../../ui/Campo.tsx'
import { ModalFormulario } from '../../ui/ModalFormulario.tsx'
import { ItensDoObjetivo } from './ItensDoObjetivo.tsx'
import estilos from './ModalObjetivo.module.css'
import { SeletorDeItens } from './SeletorDeItens.tsx'

interface Props {
  /** Objetivo em edição; ausente na criação. */
  objetivo?: Objetivo
  itens: Item[]
  origens: RegistroPorNome[]
  finalidades: RegistroPorNome[]
  catalogo: ReadonlyMap<string, ItemDoCatalogo>
  aoFechar: () => void
  acaoExtra?: ReactNode
}

export function ModalObjetivo({ objetivo, itens, origens, finalidades, catalogo, aoFechar, acaoExtra }: Props) {
  const uid = useUid()
  const [nome, setNome] = useState(objetivo?.nome ?? '')
  const [finalidadeId, setFinalidadeId] = useState(objetivo?.finalidadeId ?? '')
  const [linhas, setLinhas] = useState<LinhaItem[]>(() =>
    linhasDoObjetivo(objetivo?.unidades ?? []).map(({ itemId, quantidade }) => ({ itemId, quantidade })),
  )
  const obtidasAtuais = useMemo(
    () => new Map(linhasDoObjetivo(objetivo?.unidades ?? []).map((l) => [l.itemId, l.obtidas])),
    [objetivo],
  )
  const presentes = useMemo(() => new Set(linhas.map((l) => l.itemId)), [linhas])
  const semFinalidades = finalidades.length === 0

  const mudarQuantidade = (itemId: string, quantidade: number) =>
    setLinhas((atuais) => atuais.map((l) => (l.itemId === itemId ? { ...l, quantidade } : l)))
  const remover = (itemId: string) => setLinhas((atuais) => atuais.filter((l) => l.itemId !== itemId))
  const adicionar = (itemId: string) => setLinhas((atuais) => [...atuais, { itemId, quantidade: 1 }])

  const formulario = { nome, finalidadeId, linhas }

  return (
    <ModalFormulario
      titulo={objetivo ? 'Editar objetivo' : 'Novo objetivo'}
      largura="larga"
      rotuloSalvar={objetivo ? 'Salvar alterações' : 'Criar objetivo'}
      aoFechar={aoFechar}
      bloqueado={semFinalidades}
      acaoExtra={acaoExtra}
      validar={() =>
        validarFormularioObjetivo(formulario, {
          criando: !objetivo,
          tinhaUnidades: (objetivo?.unidades.length ?? 0) > 0,
          finalidadeExiste: finalidades.some((f) => f.id === finalidadeId),
        })
      }
      salvar={async () => {
        if (objetivo) await dadosObjetivos.editar(uid, objetivo.id, formulario)
        else await dadosObjetivos.criar(uid, formulario)
      }}
    >
      <div className={estilos.duasColunas}>
        <Campo
          rotulo="Nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Bolsa do Caçador Lendário"
          autoFocus
          autoComplete="off"
          required
        />
        {semFinalidades ? (
          <p className="t-corpo">
            Cadastre uma finalidade antes de criar objetivos. <a href="#finalidades">Ir para Finalidades</a>
          </p>
        ) : (
          <Selecao rotulo="Finalidade" value={finalidadeId} onChange={(e) => setFinalidadeId(e.target.value)} required>
            <option value="" disabled>
              Escolha a finalidade
            </option>
            {ordenarPorNome(finalidades).map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </Selecao>
        )}
      </div>

      <section className={estilos.secao} aria-labelledby="titulo-itens-objetivo">
        <h3 id="titulo-itens-objetivo" className={estilos.subtitulo}>
          Itens do objetivo
        </h3>
        <ItensDoObjetivo
          linhas={linhas}
          catalogo={catalogo}
          obtidasAtuais={obtidasAtuais}
          aoMudarQuantidade={mudarQuantidade}
          aoRemover={remover}
        />
        {objetivo && (
          <p className="t-detalhe">Ao reduzir a quantidade, as unidades ainda não obtidas saem primeiro.</p>
        )}
      </section>

      <SeletorDeItens
        itens={itens}
        origens={origens}
        catalogo={catalogo}
        presentes={presentes}
        aoAdicionar={adicionar}
      />
    </ModalFormulario>
  )
}
