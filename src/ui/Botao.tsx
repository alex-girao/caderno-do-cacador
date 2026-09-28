import type { ButtonHTMLAttributes } from 'react'
import estilos from './Botao.module.css'

type Variante = 'primario' | 'secundario' | 'texto' | 'perigo'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante
}

export function Botao({ variante = 'secundario', type = 'button', className, ...resto }: Props) {
  const classes = [estilos.botao, estilos[variante], className].filter(Boolean).join(' ')
  return <button type={type} className={classes} {...resto} />
}
