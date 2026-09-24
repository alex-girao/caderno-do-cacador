// Gera src/styles/tokens.css a partir de docs/design/tokens.json.
// Uso: npm run tokens

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

type PorTema = Record<string, string>

interface Token {
  name: string
  value: string | PorTema
}

interface Estilo {
  name: string
  fontSize: string
  lineHeight: string
  fontWeight: number
  fontStyle?: string
  letterSpacing?: string
}

interface Tokens {
  color: { themes: { id: string }[]; tokens: Token[] }
  type: {
    families: Record<string, string>
    groups: { family: string; styles: Estilo[] }[]
  }
  spacing: { tokens: Token[] }
  radius: { tokens: Token[] }
  shadow: { tokens: Token[] }
}

const raiz = resolve(import.meta.dirname, '..')
const origem = resolve(raiz, 'docs/design/tokens.json')
const destino = resolve(raiz, 'src/styles/tokens.css')

const tokens: Tokens = JSON.parse(readFileSync(origem, 'utf8'))
const temas = tokens.color.themes.map((t) => t.id)
const [temaPadrao] = temas

const declaracao = (nome: string, valor: string) => `  --${nome}: ${valor};`

function valorFixo(token: Token): string {
  if (typeof token.value !== 'string') {
    throw new Error(`Token "${token.name}" deveria ter valor único`)
  }
  return token.value
}

function valorDoTema(token: Token, tema: string): string {
  if (typeof token.value === 'string') return token.value
  const valor = token.value[tema]
  if (!valor) throw new Error(`Token "${token.name}" sem valor para o tema "${tema}"`)
  return valor
}

const fixos = [
  ...Object.entries(tokens.type.families).map(([nome, valor]) => declaracao(`fonte-${nome}`, valor)),
  ...tokens.spacing.tokens.map((t) => declaracao(t.name, valorFixo(t))),
  ...tokens.radius.tokens.map((t) => declaracao(t.name, valorFixo(t))),
]

const porTema = [...tokens.color.tokens, ...tokens.shadow.tokens]

function blocoTema(tema: string): string {
  const seletor =
    tema === temaPadrao ? `:root,\n[data-theme='${tema}']` : `[data-theme='${tema}']`
  const linhas = porTema.map((t) => declaracao(t.name, valorDoTema(t, tema)))
  return `${seletor} {\n  color-scheme: ${tema === temaPadrao ? 'light' : 'dark'};\n${linhas.join('\n')}\n}`
}

function classeTipografica(familia: string, estilo: Estilo): string {
  const linhas = [
    `  font-family: var(--fonte-${familia});`,
    `  font-size: ${estilo.fontSize};`,
    `  line-height: ${estilo.lineHeight};`,
    `  font-weight: ${estilo.fontWeight};`,
  ]
  if (estilo.fontStyle) linhas.push(`  font-style: ${estilo.fontStyle};`)
  if (estilo.letterSpacing) linhas.push(`  letter-spacing: ${estilo.letterSpacing};`)
  if (estilo.name === 'carimbo') linhas.push('  text-transform: uppercase;')
  return `.t-${estilo.name} {\n${linhas.join('\n')}\n}`
}

const classes = tokens.type.groups.flatMap((g) => g.styles.map((e) => classeTipografica(g.family, e)))

const css = `/* Arquivo gerado por scripts/gerar-tokens.ts a partir de docs/design/tokens.json.
   Não edite à mão: altere o JSON e rode \`npm run tokens\`. */

:root {
${fixos.join('\n')}
}

${temas.map(blocoTema).join('\n\n')}

${classes.join('\n\n')}
`

writeFileSync(destino, css)
console.log(`Tokens gerados em ${destino}`)
