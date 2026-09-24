# 🤠 Caderno do Caçador

> *"Um bom caçador não sai para o mato sem saber o que precisa trazer de volta."*

Aplicação estilo **TODO-LIST** para registrar os itens que precisam ser obtidos para criar outros itens, com visual inspirado em **Red Dead Redemption 2**.

Exemplo: para criar uma bolsa, é preciso obter 1 Pele de Cervo, 1 Carcaça de Lobo e 3 Penas de Ganso. Cada unidade aparece separada no checklist, porque na vida de fora-da-lei ninguém acha três gansos de uma vez.

Cada usuário possui seus próprios dados.

---

## 🛠️ Stack

| Camada   | Tecnologia                                      |
|----------|-------------------------------------------------|
| Frontend | React                                           |
| Backend  | Firebase (plano gratuito): Authentication + Firestore |
| Deploy   | Firebase Hosting                                |

Sem Cloud Functions: as regras de status são calculadas no React.

---

## 📚 Domínio

**Origem** (CRUD): de onde o item vem. Ex.: Animal, Objeto, Planta.

**Item** (CRUD): o que precisa ser obtido. Ex.: Pele de Cervo. Possui uma Origem.

**Finalidade** (CRUD): para que serve o objetivo. Ex.: Bolsa, Acampamento, Missão.

**Objetivo**: o que se deseja construir. Possui uma Finalidade e uma lista de **unidades** de itens. Na criação, os itens são escolhidos em uma lista filtrável.

Todas as entidades possuem `criadoEm` (definido na criação) e `alteradoEm` (a cada atualização).

---

## 🚦 Status do Objetivo

| Status     | Regra                                                        |
|------------|--------------------------------------------------------------|
| Aguardando | Nenhuma unidade obtida (estado inicial)                      |
| Buscando   | Pelo menos uma unidade obtida, mas não todas                 |
| Obtido     | Todas as unidades obtidas; exibe o botão **Finalizado**      |
| Finalizado | Usuário confirmou; exibe o botão **Reverter** (volta para Obtido) |

**Aguardando**, **Buscando** e **Obtido** são **derivados** das unidades, nunca gravados. No Firestore ficam apenas as decisões explícitas do usuário: `obtido` em cada unidade e `finalizado`/`finalizadoEm` no objetivo. Assim o status nunca fica dessincronizado.

```js
function calcularStatus(objetivo) {
  if (objetivo.finalizado) return 'FINALIZADO';
  const total = objetivo.unidades.length;
  const obtidas = objetivo.unidades.filter(u => u.obtido).length;
  if (total > 0 && obtidas === total) return 'OBTIDO';
  if (obtidas > 0) return 'BUSCANDO';
  return 'AGUARDANDO';
}
```

### Regras de comportamento

- Marcar ou desmarcar uma unidade atualiza o `alteradoEm` do objetivo, que sobe para o topo do seu grupo.
- Unidades só podem ser desmarcadas se o objetivo **não** estiver finalizado.
- Adicionar uma unidade não obtida a um objetivo Finalizado define `finalizado = false`, voltando automaticamente para Buscando.
- Objetivos e itens podem ser editados a qualquer momento, sempre em **modal**.
- Toda exclusão pede **confirmação**. Excluir um Item pode remover as unidades correspondentes nos objetivos.

---

## 📋 Ordenação

1. Buscando
2. Obtido
3. Aguardando
4. Finalizado

Dentro de cada grupo: `alteradoEm` (ou `criadoEm`, se vazio), do mais recente para o mais antigo.

---

## 🗄️ Estrutura no Firestore

```
users/{uid}/origens/{origemId}
  nome, criadoEm, alteradoEm

users/{uid}/finalidades/{finalidadeId}
  nome, criadoEm, alteradoEm

users/{uid}/itens/{itemId}
  nome, origemId, criadoEm, alteradoEm

users/{uid}/objetivos/{objetivoId}
  nome, finalidadeId,
  unidades: [ { id, itemId, obtido } ],
  finalizado, finalizadoEm,
  criadoEm, alteradoEm
```

As unidades ficam em um array dentro do objetivo para que marcar uma unidade e atualizar `alteradoEm` aconteça numa única escrita.

### Regras de segurança

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

---

## 🚀 Como rodar

```bash
git clone https://github.com/alex-girao/caderno-do-cacador.git
cd caderno-do-cacador
npm install
cp .env.example .env   # preencher com as credenciais do Firebase
npm run dev
```