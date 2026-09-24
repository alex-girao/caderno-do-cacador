# Caderno do Caçador — Especificação Funcional

> Nome provisório do projeto. Repositório sugerido: `https://github.com/alex-girao/caderno-do-cacador`

## 1. Visão geral

Aplicação no estilo TODO-LIST voltada à **coleta de recursos**, inspirada em *Red Dead Redemption 2*. O usuário cadastra **objetivos** (criar uma bolsa, construir algo no acampamento, concluir uma missão) e define os **itens que precisam ser obtidos** para concluí-los. O sistema acompanha o progresso da coleta e organiza a lista para destacar o que está em andamento.

Cada usuário possui seus próprios dados, isolados dos demais.

**Exemplo:**

| Objetivo | Finalidade | Itens necessários |
|---|---|---|
| Bolsa do Caçador Lendário | Bolsa | 1 Pele de Cervo, 1 Carcaça de Lobo, 3 Penas de Ganso |
| Melhoria da Tenda | Acampamento | 1 Carcaça de Carneiro, 3 Dentes de Ouro |

## 2. Tecnologia

| Camada | Escolha |
|---|---|
| Frontend | React, com identidade visual de *Red Dead Redemption 2* (pergaminho, tipografia de faroeste, tons de couro e sépia) |
| Backend | Firebase, plano gratuito (Spark), sem Cloud Functions |
| Banco de dados | Cloud Firestore |
| Autenticação | Firebase Authentication com login via conta Google |
| Hospedagem | Firebase Hosting |

## 3. Glossário

| Termo | Significado |
|---|---|
| **Finalidade** | Categoria do objetivo. Ex.: Bolsa, Acampamento, Missão. |
| **Origem** | Categoria de onde o item vem. Ex.: Animal, Objeto. |
| **Item** | Entrada do catálogo de itens do usuário. Ex.: "Pena de Ganso", de origem Animal. |
| **Objetivo** | Algo que o usuário deseja criar ou concluir. Possui nome, finalidade e unidades. |
| **Unidade** | Uma ocorrência de um item dentro do checklist de um objetivo. 3 Penas de Ganso geram 3 unidades. |

## 4. Cadastros (CRUDs)

Todos os cadastros pertencem ao usuário autenticado. Toda edição é feita em **modal**.

- **RN01 — Finalidade:** criar, listar, editar e excluir. Campo obrigatório: nome.
- **RN02 — Origem:** criar, listar, editar e excluir. Campo obrigatório: nome.
- **RN03 — Item:** criar, listar, editar e excluir. Campos obrigatórios: nome e origem.
- **RN04 — Objetivo:** criar, listar, editar e excluir. Campos obrigatórios: nome, finalidade e pelo menos um item.

## 5. Montagem do objetivo

- **RN05** — Os itens do objetivo são escolhidos a partir do catálogo, em uma **lista filtrável por nome e por origem**.
- **RN06** — Para cada item escolhido, o usuário informa a quantidade. O sistema gera **uma unidade por quantidade**, e cada unidade é marcada individualmente no checklist.
- **RN07** — Todo objetivo deve ter **pelo menos uma unidade** na criação.
- **RN08** — Ao **reduzir a quantidade** de um item na edição, as unidades removidas são **primeiro as não obtidas**, preservando o progresso.

## 6. Status

### 6.1 Cálculo

O status é **derivado**, calculado no frontend na seguinte ordem de precedência:

| Condição | Status |
|---|---|
| `finalizado = true` | **Finalizado** |
| Todas as unidades obtidas | **Obtido** |
| Pelo menos uma unidade obtida | **Buscando** |
| Nenhuma unidade obtida | **Aguardando** |

### 6.2 Regras de transição

- **RN09** — Todo objetivo novo nasce como **Aguardando**.
- **RN10** — Ao marcar a primeira unidade, o objetivo passa para **Buscando**.
- **RN11** — Com todas as unidades marcadas, o objetivo passa para **Obtido** e exibe o botão **"Finalizado"**.
- **RN12** — Ao pressionar **"Finalizado"**, o objetivo passa para **Finalizado** e vai para o fim da fila.
- **RN13** — Um objetivo finalizado exibe o botão **"Reverter"**, que o devolve para **Obtido**.
- **RN14** — Unidades podem ser marcadas e desmarcadas apenas se o objetivo **não estiver finalizado**. O status é recalculado a cada alteração.
- **RN15** — Adicionar uma unidade **não obtida** a um objetivo finalizado limpa `finalizado` e `finalizadoEm` **na mesma escrita**, e o objetivo volta automaticamente para **Buscando**.

## 7. Timestamps

- **RN16** — Todo registro possui `criadoEm`, definido no momento da criação.
- **RN17** — Todo registro possui `alteradoEm`, vazio na criação e atualizado a cada alteração.
- **RN18** — No objetivo, atualizam o `alteradoEm`: edição de dados, marcação ou desmarcação de unidade, adição ou remoção de unidades, **Finalizar** e **Reverter**.

## 8. Exclusões

Toda exclusão exige **confirmação do usuário**.

- **RN19 — Objetivo:** pode ser excluído a qualquer momento, junto com suas unidades.
- **RN20 — Unidades do objetivo:** podem ser removidas a qualquer momento na edição, respeitando a RN07. Para remover a última unidade, o usuário deve excluir o objetivo.
- **RN21 — Item do catálogo em uso:** a exclusão remove **as unidades correspondentes em todos os objetivos**. A confirmação informa quantos objetivos e unidades serão afetados. Se algum objetivo ficar sem unidades, ele é sinalizado com o aviso "sem itens" até o usuário adicionar novos itens ou excluí-lo.
- **RN22 — Finalidade ou Origem em uso:** a exclusão é **bloqueada**, e o sistema informa onde o registro está sendo usado.

## 9. Ordenação da lista de objetivos

- **RN23** — Primeiro por status, nesta ordem:
  1. Buscando
  2. Obtido
  3. Aguardando
  4. Finalizado
- **RN24** — Dentro de cada status, por `alteradoEm` (ou `criadoEm`, quando `alteradoEm` estiver vazio), **do mais recente para o mais antigo**.

## 10. Persistência

Sem Cloud Functions, o Firestore guarda apenas as **decisões explícitas do usuário**. O restante é calculado no React.

| Dado | Onde fica |
|---|---|
| `obtido: true/false` de cada unidade | Firestore |
| `finalizado` e `finalizadoEm` do objetivo | Firestore |
| Status Aguardando, Buscando e Obtido | Calculado no React |
| Ordenação da lista | Calculada no React |

Dessa forma, o status nunca fica dessincronizado das unidades.

## 11. Segurança

- **RN25** — Acesso somente para usuários autenticados.
- **RN26** — Cada usuário lê e escreve apenas os próprios dados, garantido pelas Security Rules do Firestore.

## 12. Modelo de dados no Firestore

### 12.1 Estrutura de coleções

Todos os dados ficam aninhados sob o `uid` do usuário, o que garante o isolamento exigido pela RN26.

```
users/{uid}
 ├── finalidades/{finalidadeId}
 │     nome, criadoEm, alteradoEm
 ├── origens/{origemId}
 │     nome, criadoEm, alteradoEm
 ├── itens/{itemId}
 │     nome, origemId, criadoEm, alteradoEm
 └── objetivos/{objetivoId}
       nome, finalidadeId
       finalizado, finalizadoEm
       criadoEm, alteradoEm
       itemIds: [itemId, ...]
       unidades: [ { id, itemId, obtido }, ... ]
```

### 12.2 Campos

**finalidades** e **origens**

| Campo | Tipo | Observação |
|---|---|---|
| `nome` | string | Obrigatório |
| `criadoEm` | timestamp | `serverTimestamp()` na criação |
| `alteradoEm` | timestamp \| null | `null` na criação |

**itens**

| Campo | Tipo | Observação |
|---|---|---|
| `nome` | string | Obrigatório |
| `origemId` | string | Referência a `origens`. Obrigatório |
| `criadoEm` | timestamp | `serverTimestamp()` na criação |
| `alteradoEm` | timestamp \| null | `null` na criação |

**objetivos**

| Campo | Tipo | Observação |
|---|---|---|
| `nome` | string | Obrigatório |
| `finalidadeId` | string | Referência a `finalidades`. Obrigatório |
| `finalizado` | boolean | `false` na criação. Decisão explícita do usuário |
| `finalizadoEm` | timestamp \| null | Preenchido ao Finalizar, limpo ao Reverter ou pela RN15 |
| `itemIds` | array\<string\> | Ids distintos dos itens presentes em `unidades`. Campo desnormalizado |
| `unidades` | array\<map\> | Uma entrada por unidade: `{ id, itemId, obtido }` |
| `criadoEm` | timestamp | `serverTimestamp()` na criação |
| `alteradoEm` | timestamp \| null | `null` na criação. Atualizado conforme a RN18 |

### 12.3 Decisão: unidades embutidas no objetivo

As unidades são armazenadas como **array dentro do documento do objetivo**, e não em uma subcoleção.

- **Custo de leitura:** a lista principal precisa de todas as unidades para calcular o status. Embutidas, custam uma leitura por objetivo; em subcoleção, seriam N+1 leituras.
- **Atomicidade:** marcar uma unidade e atualizar o `alteradoEm` ocorrem na mesma escrita. A RN15 também fica atômica.
- **Tamanho:** o limite de 1 MB por documento comporta milhares de unidades.

**Contrapartida:** o Firestore não atualiza um elemento isolado de um array de mapas, então cada alteração reescreve o array. Para evitar que escritas simultâneas de dispositivos diferentes se sobrescrevam, **toda alteração de unidades usa transação** (`runTransaction`).

### 12.4 Decisão: campo desnormalizado `itemIds`

O Firestore não consulta dentro de arrays de mapas. O campo `itemIds` permite localizar os objetivos afetados pela exclusão de um item do catálogo (RN21). Ele deve ser **recalculado em toda escrita que altere `unidades`**.

### 12.5 Consultas de verificação de uso

| Regra | Coleção | Consulta |
|---|---|---|
| RN21 — Item em uso | `objetivos` | `where("itemIds", "array-contains", itemId)` |
| RN22 — Finalidade em uso | `objetivos` | `where("finalidadeId", "==", finalidadeId)` |
| RN22 — Origem em uso | `itens` | `where("origemId", "==", origemId)` |

A exclusão em cascata da RN21 usa **batch** para remover o item do catálogo e atualizar todos os objetivos afetados de uma só vez.

### 12.6 Leitura e ordenação

Como o status é calculado, o Firestore não consegue ordenar por ele. A coleção `objetivos` é assinada inteira com `onSnapshot`, e o status e a ordenação (RN23 e RN24) são calculados no React. Isso também atualiza a tela em tempo real entre dispositivos.

### 12.7 Timestamps

Todos os timestamps usam `serverTimestamp()`, para que a ordenação não dependa do relógio do dispositivo.

### 12.8 Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null
                         && request.auth.uid == uid;
    }
  }
}
```
