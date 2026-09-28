# CLAUDE.md — Caderno do Caçador

Contexto permanente para o Claude Code trabalhar neste repositório.

## O projeto

Checklist de coleta de recursos inspirado na estética de Red Dead Redemption 2. O usuário cadastra objetivos (uma bolsa, uma melhoria do acampamento, uma missão) e marca, unidade por unidade, os itens obtidos para concluí-los.

**Leia antes de qualquer implementação:**

- `docs/ESPECIFICACAO.md`: regras de negócio numeradas (RN01 a RN27) e o modelo de dados do Firestore (seção 12). É a fonte da verdade do comportamento.
- `docs/design/DESIGN-SYSTEM.md`: guia visual, voz da interface e regras de uso dos tokens.
- `docs/design/tokens.json`: cores (temas `pergaminho` e `fogueira`), tipografia, espaçamento, raios e sombras.
- `docs/design/telas/*.dc.html`: mockups de referência das telas.

## Stack

- React + Vite + TypeScript
- Firebase no plano gratuito (Spark), SDK modular: Authentication (login Google), Firestore e Hosting
- **Sem Cloud Functions**: toda regra de negócio roda no front
- Testes com Vitest

## Regras de arquitetura

1. **Status é derivado, nunca gravado.** Aguardando, Buscando e Obtido são calculados a partir das unidades. O Firestore guarda apenas `obtido` em cada unidade e `finalizado`/`finalizadoEm` no objetivo. O cálculo fica numa função pura em `src/domain/`, coberta por testes.
2. **Unidades embutidas** como array no documento do objetivo (seção 12.3 da especificação). Toda escrita que altere unidades usa `runTransaction` e recalcula o campo desnormalizado `itemIds`.
3. **Timestamps** sempre com `serverTimestamp()`. `alteradoEm` nasce `null` e é atualizado conforme a RN18.
4. **Isolamento por usuário**: tudo sob `users/{uid}/...`, com as Security Rules da seção 12.8 em `firestore.rules`.
5. **Ordenação no cliente** (RN23 e RN24), a partir de um `onSnapshot` da coleção de objetivos.
6. Toda exclusão pede confirmação; toda edição acontece em modal.
7. Configuração do Firebase em `.env.local` com variáveis `VITE_FIREBASE_*`. Esse arquivo **nunca** é commitado; mantenha um `.env.example`.

## Como usar os mockups `.dc.html`

Os arquivos em `docs/design/telas/` são **referência visual**, não código a importar. Eles usam uma sintaxe própria de template (`{{ }}`, `<sc-for>`, `<sc-if>`, `class Component extends DCLogic`). Ao implementar:

- Reproduza estrutura, hierarquia, espaçamentos, cores e textos das telas com componentes React.
- Converta os valores fixos de cor em variáveis CSS geradas a partir de `docs/design/tokens.json`, com os dois temas (`[data-theme="pergaminho"]` e `[data-theme="fogueira"]`).
- A lógica em `ListaObjetivos.dc.html` (status, agrupamento, ordenação, marcar, Finalizado e Reverter) é um protótipo que serve de referência de comportamento; a implementação real segue a especificação.
- As fontes estão em `docs/design/fonts/`. Mova-as para `public/fonts/` e declare os `@font-face`.

## Elementos visuais que não podem se perder

- O **carimbo de status**: borda de 2px na cor do status, caixa-alta, inclinado −2°.
- O **lacre**: círculo vazio em `linha` para unidade pendente; preenchido em `sangue`, com ✓, para unidade obtida, e o nome riscado.
- Objetivos finalizados ficam sobre `papel`, sem cartão, com os lacres travados.
- Alvos de toque com no mínimo 44px e foco de teclado visível.

## Convenções

- Código, nomes de domínio e mensagens de commit em português, seguindo os termos da especificação (Objetivo, Unidade, Item, Origem, Finalidade).
- Commits pequenos, um por etapa concluída, no padrão Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).
- Antes de encerrar cada etapa, rode lint e testes.
