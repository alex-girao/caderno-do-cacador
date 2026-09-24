import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react'
import estilos from './Campo.module.css'

interface Rotulado {
  rotulo: string
}

function Rotulo({ id, rotulo, children }: { id: string; rotulo: string; children: ReactNode }) {
  return (
    <div className={estilos.campo}>
      <label htmlFor={id} className="t-detalhe">
        {rotulo}
      </label>
      {children}
    </div>
  )
}

export function Campo({ rotulo, ...resto }: Rotulado & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId()
  return (
    <Rotulo id={id} rotulo={rotulo}>
      <input id={id} type="text" className={estilos.controle} {...resto} />
    </Rotulo>
  )
}

export function Selecao({ rotulo, ...resto }: Rotulado & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId()
  return (
    <Rotulo id={id} rotulo={rotulo}>
      <select id={id} className={estilos.controle} {...resto} />
    </Rotulo>
  )
}
