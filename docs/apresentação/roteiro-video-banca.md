# Roteiro de Video - Banca

## Objetivo

Montar uma apresentacao de `4 minutos`, com `5 pessoas`, em estilo `startup vendendo produto`, equilibrando:

- problema
- solucao
- diferencial
- demonstracao
- fechamento

Tom recomendado:

- confiante
- objetivo
- comercial
- com linguagem simples
- com foco em valor e execucao

## Estrutura de Tempo

Tempo total: `4:00`

Divisao sugerida:

- Pessoa 1: `0:00 - 0:40`
- Pessoa 2: `0:40 - 1:20`
- Pessoa 3: `1:20 - 2:00`
- Pessoa 4: `2:00 - 2:50`
- Pessoa 5: `2:50 - 4:00`

## Enredo

### Pessoa 1 - Abertura e problema

Tempo: `40s`

Fala sugerida:

> Boa tarde. Nos somos a equipe da `Liquidly`, uma startup que resolve um problema operacional muito comum em empresas industriais e de supply chain: a dificuldade de cruzar, com rapidez e confiabilidade, os dados de `BOM`, `PO` e `Invoice`.
>
> Hoje, esse processo muitas vezes e manual, espalhado em planilhas, sujeito a erro e com baixa rastreabilidade. Isso gera atraso, retrabalho e decisao baseada em informacao incompleta.
>
> A nossa proposta e transformar esse processo em uma plataforma unica, visual e orientada a analise.

Slide sugerido:

- dor do mercado
- planilhas descentralizadas
- baixa rastreabilidade
- risco operacional

### Pessoa 2 - Solucao e proposta de valor

Tempo: `40s`

Fala sugerida:

> A `Liquidly` centraliza os dados da operacao em um unico ecossistema digital. Com nossa plataforma, a empresa cadastra projetos, importa ou registra BOM, pedidos de compra, notas fiscais e regras de conversao, e o sistema faz o cruzamento dessas informacoes automaticamente.
>
> O resultado e uma visao clara do consumo, das divergencias e da liquidacao por projeto. Em vez de procurar inconsistencias manualmente, o gestor passa a enxergar o problema em tempo real.

Slide sugerido:

- input: BOM + PO + Invoice
- processamento
- output: analise + relatorio + decisao

### Pessoa 3 - Arquitetura e robustez

Tempo: `40s`

Fala sugerida:

> Pensando em escalabilidade e produto real, construimos a `Liquidly` como uma solucao multiplataforma. Temos um `backend` em Spring Boot, um `frontend web` em React, um `app mobile` em Expo e um `email service` para automacoes de notificacao e envio de relatorios.
>
> Tambem implementamos autenticacao com JWT, recuperacao de senha, isolamento por empresa e execucao assincrona de relatorios com persistencia de jobs. Isso mostra que o projeto nao e apenas uma interface bonita, mas uma base tecnica pronta para evoluir como produto.

Slide sugerido:

- web
- mobile
- backend
- banco
- servico de e-mail

### Pessoa 4 - Demonstracao do fluxo

Tempo: `50s`

Fala sugerida:

> Na pratica, o usuario entra na plataforma, cria ou seleciona um projeto, registra os dados operacionais e executa a liquidacao. A aplicacao cruza os registros e devolve os resultados em tela, com possibilidade de gerar relatorio em Excel.
>
> Um dos diferenciais e que o relatorio roda como job assincrono. O usuario acompanha o progresso e faz o download quando estiver pronto. Isso melhora a experiencia e suporta melhor cargas mais pesadas.
>
> No mobile, o acesso tambem fica disponivel para consulta e acompanhamento fora do escritorio.

Demonstracao sugerida:

- login
- dashboard
- tela de projetos
- tela de BOM/Invoice/PO
- clique em gerar relatorio
- status do job
- download

### Pessoa 5 - Fechamento e pitch final

Tempo: `1m10s`

Fala sugerida:

> O que estamos apresentando aqui nao e apenas um sistema academico. E uma base de produto com aplicacao real para empresas que precisam controlar melhor seus processos de supply, consumo e reconciliacao de dados.
>
> A `Liquidly` reduz dependencia de planilhas, melhora confiabilidade operacional e transforma dados dispersos em informacao util para decisao.
>
> Como proximos passos, enxergamos evolucoes em analytics, automacao de importacao, observabilidade, CI/CD e deploy em nuvem com stack containerizada.
>
> Em resumo: a `Liquidly` entrega organizacao, rastreabilidade e inteligencia operacional em uma experiencia moderna, multiplataforma e pronta para crescer.
>
> Obrigado. Estamos a disposicao para perguntas.

Slide sugerido:

- proposta de valor
- diferenciais
- proximo passo de mercado
- encerramento

## Sequencia de Slides

Sugestao de 5 slides:

1. Problema de mercado
2. Solucao Liquidly
3. Arquitetura e tecnologia
4. Demo do fluxo
5. Valor de negocio e fechamento

## Direcao de Gravacao

Recomendacoes:

- manter camera ligada apenas na abertura e no fechamento, se o tempo estiver apertado
- durante a demo, usar narracao com captura de tela
- cada pessoa deve falar com transicao curta para a proxima
- evitar ler texto integralmente; usar o roteiro como guia

Transicoes sugeridas:

- "E para resolver isso, criamos a Liquidly."
- "Agora que mostramos o valor, vale ver como isso foi construido."
- "Com a base tecnica pronta, vamos para a experiencia do usuario."
- "E e justamente aqui que a Liquidly se diferencia como produto."

## Versao Mais Comercial

Se quiser um tom ainda mais startup/pitch, a frase de abertura pode ser:

> Empresas perdem tempo e dinheiro todos os dias tentando reconciliar BOM, pedidos de compra e notas fiscais em processos manuais. A `Liquidly` nasceu para transformar esse caos operacional em decisao inteligente.

E o fechamento pode ser:

> A `Liquidly` nao vende apenas software. Ela entrega visibilidade, controle e confiabilidade para a operacao.

## Checklist Antes de Gravar

- validar quem fala cada bloco
- deixar a demo previamente carregada
- evitar depender de internet instavel
- testar audio
- limitar cada fala ao tempo combinado
- deixar uma versao reserva da demo em video

## Plano B se a demo falhar

Se houver problema ao vivo, a Pessoa 4 pode substituir por:

> Mesmo sem executar a demonstracao completa neste momento, o fluxo principal da plataforma e composto por autenticacao, gestao dos dados operacionais, processamento de liquidacao e geracao de relatorio. Toda essa cadeia ja esta implementada e documentada no projeto.
