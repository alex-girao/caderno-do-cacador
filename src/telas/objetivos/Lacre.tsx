import estilos from './Lacre.module.css'

/** Círculo vazio em linha para unidade pendente; lacre de cera em sangue, com ✓, para obtida. */
export function Lacre({ obtido }: { obtido: boolean }) {
  return (
    <span className={obtido ? `${estilos.lacre} ${estilos.obtido}` : estilos.lacre} aria-hidden="true">
      {obtido && (
        <svg width="10" height="10" viewBox="0 0 10 10">
          <path
            d="M1.8 5.2l2 2 4.4-4.6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  )
}
