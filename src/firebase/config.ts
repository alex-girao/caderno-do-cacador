import type { FirebaseOptions } from 'firebase/app'

// Configuração lida do .env.local (modelo em .env.example).
const variaveis = {
  apiKey: 'VITE_FIREBASE_API_KEY',
  authDomain: 'VITE_FIREBASE_AUTH_DOMAIN',
  projectId: 'VITE_FIREBASE_PROJECT_ID',
  storageBucket: 'VITE_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'VITE_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'VITE_FIREBASE_APP_ID',
} as const satisfies Record<string, keyof ImportMetaEnv>

function lerConfiguracao(): FirebaseOptions {
  const faltando = Object.values(variaveis).filter((nome) => !import.meta.env[nome])
  if (faltando.length > 0) {
    throw new Error(
      `Configuração do Firebase incompleta. Defina no .env.local: ${faltando.join(', ')}. ` +
        'Veja o modelo em .env.example.',
    )
  }
  return Object.fromEntries(
    Object.entries(variaveis).map(([campo, nome]) => [campo, import.meta.env[nome]]),
  )
}

export const configuracaoFirebase = lerConfiguracao()
