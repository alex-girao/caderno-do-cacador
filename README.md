# 🤠 Caderno do Caçador

> *"Um bom caçador não sai para o mato sem saber o que precisa trazer de volta."*

Checklist de coleta de recursos com visual inspirado em **Red Dead Redemption 2**. Você cadastra **objetivos** (uma bolsa, uma melhoria do acampamento, uma missão) e marca, unidade por unidade, os itens obtidos para concluí-los.

Exemplo: para criar uma bolsa, é preciso obter 1 Pele de Cervo, 1 Carcaça de Lobo e 3 Penas de Ganso. Cada unidade aparece separada no checklist, porque na vida de fora-da-lei ninguém acha três gansos de uma vez.

Cada usuário entra com a conta Google e vê apenas os próprios dados.

---

## ✨ Funcionalidades

- **Cadastros** de Origem, Finalidade e Item, com edição em modal e nomes únicos em cada cadastro.
- **Objetivos** montados a partir do catálogo de itens, numa lista filtrável por nome e por origem, com quantidade por item.
- **Checklist por unidade**: cada unidade é marcada com um lacre de cera; o status do objetivo é recalculado a cada marcação.
- **Lista agrupada por status**, atualizada em tempo real entre dispositivos.
- **Finalizado** e **Reverter** para arquivar objetivos concluídos.
- **Exclusões com confirmação**: Origem e Finalidade em uso não podem ser excluídas; excluir um Item remove suas unidades de todos os objetivos.
- **Dois temas**: Pergaminho (claro) e Fogueira (escuro).

---

## 🛠️ Tecnologias

| Camada | Tecnologia |
|---|---|
| Interface | React 19, TypeScript, Vite, CSS Modules com variáveis geradas dos tokens de design |
| Autenticação | Firebase Authentication (login Google) |
| Banco de dados | Cloud Firestore |
| Hospedagem | Firebase Hosting |
| Qualidade | Vitest (testes), oxlint (lint) |

Tudo roda no plano gratuito (Spark), **sem Cloud Functions**: as regras de negócio ficam no front, em funções puras testadas em `src/domain/`.

---

## 🚦 Status do objetivo

| Status | Quando |
|---|---|
| **Buscando** | Pelo menos uma unidade obtida, mas não todas |
| **Obtido** | Todas as unidades obtidas; exibe o botão **Finalizado** |
| **Aguardando** | Nenhuma unidade obtida (estado inicial) |
| **Finalizado** | Confirmado pelo usuário; exibe o botão **Reverter** |

A lista segue essa ordem e, dentro de cada grupo, mostra primeiro o que foi alterado mais recentemente.

Aguardando, Buscando e Obtido são **derivados** das unidades, nunca gravados. O Firestore guarda apenas as decisões explícitas do usuário: `obtido` em cada unidade e `finalizado`/`finalizadoEm` no objetivo. Assim o status nunca fica dessincronizado.

As regras completas, numeradas de RN01 a RN27, estão na [especificação](docs/ESPECIFICACAO.md).

---

## 🗄️ Dados no Firestore

```
users/{uid}/origens/{origemId}         nome, criadoEm, alteradoEm
users/{uid}/finalidades/{finalidadeId} nome, criadoEm, alteradoEm
users/{uid}/itens/{itemId}             nome, origemId, criadoEm, alteradoEm
users/{uid}/objetivos/{objetivoId}     nome, finalidadeId,
                                       unidades: [ { id, itemId, obtido } ],
                                       itemIds, finalizado, finalizadoEm,
                                       criadoEm, alteradoEm
```

As unidades ficam embutidas no objetivo, e toda alteração delas usa transação. O campo `itemIds` é desnormalizado para localizar os objetivos afetados pela exclusão de um item. As regras de segurança estão em [`firestore.rules`](firestore.rules): cada usuário lê e escreve apenas sob o próprio `uid`.

---

## 📁 Estrutura do código

```
src/
├── domain/   regras de negócio em funções puras, com testes (*.test.ts)
├── dados/    acesso ao Firestore, um módulo por coleção
├── telas/    telas de Objetivos, Itens, Origens e Finalidades
├── ui/       componentes reutilizáveis (modal, confirmação, campos, botões)
├── app/      casca: login, cabeçalho, navegação e tema
├── firebase/ inicialização do Firebase e autenticação
└── styles/   tokens gerados, fontes e estilos base
docs/
├── ESPECIFICACAO.md   regras de negócio e modelo de dados
└── design/            sistema de design, tokens e telas de referência
```

---

## 🚀 Como rodar localmente

### Pré-requisitos

- **Node.js 22.18 ou superior** (o projeto é desenvolvido no Node 24).
- Um **projeto no Firebase** com:
  - **Authentication** com o provedor **Google** ativado;
  - **Cloud Firestore** criado;
  - um **app Web** registrado, que fornece a configuração do passo 2.

### Passos

1. Clone o repositório e instale as dependências:

   ```bash
   git clone https://github.com/alex-girao/caderno-do-cacador.git
   cd caderno-do-cacador
   npm install
   ```

2. Crie o `.env.local` a partir do modelo:

   ```bash
   cp .env.example .env.local
   ```

   Preencha as seis variáveis `VITE_FIREBASE_*` com a configuração do app Web, que fica no console do Firebase em **Configurações do projeto → Geral → Seus apps**. O `.env.local` é ignorado pelo Git e nunca deve ser commitado.

3. Inicie o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

   Abra o endereço exibido no terminal (por padrão, `http://localhost:5173`). O domínio `localhost` já vem autorizado para login no Firebase Authentication.

### Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm test` | Testes do domínio com Vitest (`npm run test:watch` para modo contínuo) |
| `npm run lint` | Lint com oxlint |
| `npm run build` | Checagem de tipos e build de produção em `dist/` |
| `npm run preview` | Serve o build de `dist/` localmente |
| `npm run tokens` | Regera `src/styles/tokens.css` a partir de `docs/design/tokens.json` |
| `npm run verificar` | Lint (falhando também com avisos), testes e build |

---

## 📦 Como publicar

A publicação usa o [Firebase CLI](https://firebase.google.com/docs/cli). O projeto padrão, `caderno-do-cacador`, está definido em `.firebaserc`.

1. Instale o CLI e faça login, uma única vez:

   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. Publique o site:

   ```bash
   npm run deploy
   ```

   O script roda lint, testes e build, e só publica no Firebase Hosting se tudo passar. As variáveis do `.env.local` são embutidas no build, então publique a partir de uma máquina com o `.env.local` do projeto certo.

3. Quando alterar `firestore.rules`, publique as regras:

   ```bash
   npm run deploy:regras
   ```

O site fica disponível em `https://caderno-do-cacador.web.app`. Os domínios `web.app` e `firebaseapp.com` do projeto já vêm autorizados para o login com Google. Um domínio próprio precisa ser adicionado em **Authentication → Configurações → Domínios autorizados**.

Os arquivos com hash em `assets/` são servidos com cache de um ano, e o `index.html`, sem cache. Assim, cada publicação chega aos usuários no próximo carregamento da página.

---

## 📚 Documentação

- [Especificação funcional](docs/ESPECIFICACAO.md): regras de negócio e modelo de dados.
- [Sistema de design](docs/design/DESIGN-SYSTEM.md): voz, cores, tipografia e os elementos de identidade.
