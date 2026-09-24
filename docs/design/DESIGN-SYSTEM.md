# Caderno do Caçador — sistema de design

O Caderno do Caçador é um checklist de coleta de recursos inspirado na estética de *Red Dead Redemption 2*. A interface é o diário de campo de um caçador: folhas de papel envelhecido, tinta escura, carimbos de status e um lacre de cera vermelho para cada unidade obtida. No escuro, o mesmo caderno aberto perto da fogueira.

Este sistema é uma inspiração de época, não uma reprodução. Ele não usa logotipos, fontes, ilustrações ou nomes de marca do jogo.

## Voz

O caderno fala como um caçador experiente anota: frases curtas, verbos diretos, sem exclamações e sem pressa. Os textos descrevem o que existe e o que acontece, na linguagem de quem joga.

- **Faça:** "Novo objetivo", "Pena de Ganso", "3 de 5 obtidas", "Nenhum objetivo no caderno. Cadastre o primeiro para começar a caçada."
- **Não faça:** gírias forçadas de faroeste em cada botão, emoji na interface, exclamações.
- **Erros** dizem o que houve e o que fazer: "Não foi possível salvar a marcação. Verifique a conexão e tente de novo."
- **Confirmações de exclusão** nomeiam o que será perdido: "Excluir Pele de Cervo também remove 4 unidades em 2 objetivos."
- Os botões de status seguem a especificação: **Finalizado** e **Reverter**.

## Fundamentos visuais

**Cor.** Dois temas: `pergaminho` (claro, o padrão) e `fogueira` (escuro). A página é `papel`; objetivos em andamento ficam em cartões `papel-marcado`; texto em `tinta` e `tinta-desbotada`. A cor da marca é `sangue`, reservada à ação principal, ao lacre da unidade obtida e ao anel de foco. Cada status tem sua tinta de carimbo: `status-buscando` (latão), `status-obtido` (verde-musgo), `status-aguardando` (tinta escura) e `status-finalizado` (desbotado). O status nunca é comunicado só pela cor: o carimbo sempre traz o nome escrito.

**Tipografia.** Duas famílias bem distintas. `display` é a Rye, tipo de madeira dos cartazes do Velho Oeste, usada só no nome do app (`marca`) e nos cabeçalhos de grupo e de modal (`secao`), nunca abaixo de 22px. `texto` é a Libre Caslon Text, a serifa dos impressos americanos do século XIX, para todo o resto. Metadados vão em `detalhe`, em itálico, como anotações de margem. A caixa-alta aparece em um único lugar: o texto do `carimbo`.

**Forma.** Papel não tem canto arredondado: cartões e modais usam `raio-papel`. Botões, campos e carimbos usam `raio-leve`. O único círculo do sistema é o lacre (`raio-lacre`). Cartões não têm sombra; a separação vem da cor do papel e de pautas em `linha`. Só os modais flutuam, com `sombra-modal`.

**Espaço.** Base de 4px dobrando: `space-1` a `space-8`. Checklists são densos (`space-2` entre unidades); grupos de status respiram (`space-8`).

## Os elementos que fazem a identidade

**O carimbo de status.** Texto em `carimbo`, borda de 2px e texto na mesma cor de status, fundo transparente, `raio-leve`, levemente inclinado (−2°), como um carimbo de borracha na margem da folha. É o elemento mais marcante do sistema; nada mais na tela recebe inclinação ou ornamento.

**O lacre da unidade.** Cada unidade do checklist começa com um círculo vazio de 18px em borda `linha`. Ao ser obtida, vira um lacre preenchido em `sangue`, e o nome da unidade ganha um risco de tinta (`line-through` em `tinta-desbotada`). Em objetivos finalizados, os lacres ficam travados e o cursor não indica clique.

**Objetivos finalizados.** Saem do cartão e ficam direto sobre `papel`, com o carimbo `status-finalizado`. São páginas já arquivadas do caderno.

## Iconografia

Ainda não há conjunto de ícones nem logotipo. O nome escrito em Rye funciona como marca. Para ações secundárias (editar, excluir, reverter), prefira texto; se ícones forem necessários, use traço fino de 1.5px em `currentColor`, sem preenchimento, para combinar com o desenho de pena da Caslon.

## Acessibilidade

Todo texto passa 4.5:1 sobre as superfícies indicadas nas notas dos tokens, nos dois temas; `status-finalizado` é usado apenas sobre `papel`. Bordas de controles (`linha`) passam 3:1. O foco do teclado é sempre visível com `anel-foco`. Os tokens `status-buscando` e `status-obtido` diferem pouco em luminosidade no tema claro, por isso o carimbo sempre carrega o nome do status.

## Fontes

Rye e Libre Caslon Text são distribuídas sob a SIL Open Font License, obtidas do repositório oficial do Google Fonts e convertidas para WOFF2.
