# Plano de Testes de Fragilidades

## Objetivo

Este documento orienta a validacao de fragilidades, erros, bugs e regressões no ecossistema `Liquidly`, cobrindo:

- `backend-api`
- `frontend-web`
- `frontend-mobile`

O foco principal e testar autenticacao, autorizacao, isolamento de dados por empresa, recuperacao de senha, login facial, execucao de relatorios, persistencia, resiliencia a falhas e comportamento apos expirar ou invalidar sessao.

## Prioridades

- `P0`: falhas de seguranca, vazamento de dados, exclusao indevida, autenticacao quebrada
- `P1`: falhas funcionais criticas, dados inconsistentes, relatorios incorretos, sessao quebrada
- `P2`: falhas de UX, mensagens erradas, recuperacao incompleta, inconsistencias menores

## Ambiente Recomendado

- Backend rodando localmente e/ou em homologacao
- Banco com pelo menos:
  - 2 empresas diferentes
  - 2 usuarios por empresa
  - projetos, BOMs, invoices, POs e conversions por empresa
- Web em modo `dev` e `build`
- Mobile em `Expo` com dispositivo Android e iOS, se possivel
- Ferramentas auxiliares:
  - DevTools do navegador
  - Postman ou Insomnia
  - logs do backend
  - acesso ao banco

## Estrategia de Execucao

1. Executar primeiro os casos `P0`.
2. Registrar:
   - passo a passo
   - payload enviado
   - resposta HTTP
   - impacto observado
   - evidencia em print/log
3. Repetir os cenarios no web e no mobile quando houver mesma integracao.
4. Reexecutar os casos apos qualquer correcao.

## Hotspots Ja Identificados na Revisao

- Exposicao de usuarios e enumeracao de contas no backend
- Segredo JWT fixo em codigo-fonte
- Recuperacao de senha sem expiracao ou limitacao de tentativas
- Cadastro facial sem garantia de unicidade no backend
- Sessao expirada no mobile sem redirecionamento confiavel para a tela de entrada
- Jobs de relatorio mantidos apenas em memoria
- Fallback automatico para H2 em memoria quando os bancos externos falham

## Casos de Teste

### 1. Autenticacao e Sessao

#### T01 - Login com email e senha validos

- Prioridade: `P1`
- Sistema: `backend-api`, `frontend-web`, `frontend-mobile`
- Passos:
  1. Logar com credenciais validas.
  2. Confirmar recebimento de token.
  3. Navegar para dashboard.
- Esperado:
  - token salvo corretamente
  - dados do usuario carregados
  - requests autenticados funcionando

#### T02 - Login com senha invalida

- Prioridade: `P1`
- Sistema: `backend-api`, `frontend-web`, `frontend-mobile`
- Passos:
  1. Informar email valido e senha errada.
- Esperado:
  - resposta `401`
  - mensagem de erro consistente
  - nenhuma sessao persistida

#### T03 - Token expirado durante uso

- Prioridade: `P0`
- Sistema: `backend-api`, `frontend-web`, `frontend-mobile`
- Passos:
  1. Logar normalmente.
  2. Invalidar a sessao no banco ou aguardar expiracao do JWT.
  3. Tentar carregar projetos, BOM ou relatorio.
- Esperado:
  - backend devolver `401`
  - web limpar sessao e redirecionar para login
  - mobile limpar sessao e voltar para tela de entrada sem exigir reinicio manual

#### T04 - Logout invalida a sessao atual

- Prioridade: `P1`
- Sistema: `backend-api`, `frontend-web`, `frontend-mobile`
- Passos:
  1. Logar.
  2. Fazer logout.
  3. Repetir uma chamada autenticada com o token anterior.
- Esperado:
  - sessao removida no backend
  - token antigo rejeitado
  - usuario redirecionado corretamente

#### T05 - Varias sessoes do mesmo usuario

- Prioridade: `P1`
- Sistema: `backend-api`, `frontend-web`, `frontend-mobile`
- Passos:
  1. Logar com mesmo usuario em web e mobile.
  2. Encerrar sessao em um cliente.
  3. Verificar comportamento do outro cliente.
- Esperado:
  - regras de sessao coerentes
  - nenhuma exclusao indevida de conta com outra sessao ativa

### 2. Autorizacao e Isolamento de Dados

#### T06 - Usuario autenticado tenta consultar usuarios globais

- Prioridade: `P0`
- Sistema: `backend-api`
- Passos:
  1. Autenticar como usuario comum.
  2. Chamar `GET /api/users`.
  3. Chamar `GET /api/users/{id}` para ids de outras contas.
- Esperado:
  - acesso negado ou restrito ao proprio usuario
  - nenhum email, nome ou empresa de terceiros exposto

#### T07 - Enumeracao de emails publicamente

- Prioridade: `P0`
- Sistema: `backend-api`, `frontend-web`, `frontend-mobile`
- Passos:
  1. Chamar `GET /api/users/exists?email=...` com email existente.
  2. Repetir com email inexistente.
- Esperado:
  - endpoint nao deve permitir inferir quais contas existem publicamente

#### T08 - Acesso cruzado por empresa

- Prioridade: `P0`
- Sistema: `backend-api`
- Passos:
  1. Autenticar como empresa A.
  2. Requisitar endpoints `/company/{companyId}` usando id da empresa B.
- Esperado:
  - resposta `403`
  - nenhum dado da empresa B retornado

#### T09 - Criacao de BOM/Invoice/Projeto com referencia cruzada

- Prioridade: `P0`
- Sistema: `backend-api`
- Passos:
  1. Autenticar como empresa A.
  2. Tentar criar ou atualizar registros usando `project.id` pertencente a empresa B.
  3. Verificar persistencia no banco.
- Esperado:
  - operacao rejeitada
  - nenhuma associacao cruzada persistida

### 3. Recuperacao de Senha

#### T10 - Fluxo completo de recuperacao

- Prioridade: `P1`
- Sistema: `backend-api`, `frontend-web`, `frontend-mobile`
- Passos:
  1. Solicitar codigo de recuperacao.
  2. Receber codigo.
  3. Redefinir senha.
  4. Logar com a nova senha.
- Esperado:
  - codigo funciona uma unica vez
  - senha antiga deixa de funcionar

#### T11 - Reuso de codigo de recuperacao

- Prioridade: `P0`
- Sistema: `backend-api`
- Passos:
  1. Solicitar codigo.
  2. Redefinir a senha com sucesso.
  3. Tentar reutilizar o mesmo codigo.
- Esperado:
  - segunda tentativa falha

#### T12 - Codigo antigo sem expiracao

- Prioridade: `P0`
- Sistema: `backend-api`
- Passos:
  1. Solicitar codigo.
  2. Aguardar periodo prolongado.
  3. Tentar redefinir senha com o mesmo codigo.
- Esperado:
  - codigo deveria expirar apos janela curta

#### T13 - Forca bruta de codigo de recuperacao

- Prioridade: `P0`
- Sistema: `backend-api`
- Passos:
  1. Tentar varios codigos incorretos para o mesmo email.
  2. Medir se ha bloqueio, rate limit ou captcha.
- Esperado:
  - limitacao de tentativas e bloqueio temporario

### 4. Login Facial e Cadastro Facial

#### T14 - Login facial com rosto correto

- Prioridade: `P1`
- Sistema: `backend-api`, `frontend-web`, `frontend-mobile`
- Passos:
  1. Cadastrar usuario com face.
  2. Fazer login facial com a mesma imagem ou amostra valida.
- Esperado:
  - autenticacao correta do mesmo usuario

#### T15 - Login facial com rosto de outra pessoa

- Prioridade: `P0`
- Sistema: `backend-api`, `frontend-web`, `frontend-mobile`
- Passos:
  1. Tentar logar com imagem de usuario diferente.
  2. Testar variacoes de iluminacao, enquadramento e baixa qualidade.
- Esperado:
  - backend negar autenticacao

#### T16 - Cadastro de face duplicada por canais diferentes

- Prioridade: `P0`
- Sistema: `backend-api`, `frontend-web`, `frontend-mobile`
- Passos:
  1. Cadastrar uma face no web.
  2. Tentar cadastrar a mesma face no mobile.
  3. Fazer login facial e observar qual conta e autenticada.
- Esperado:
  - o backend deve impedir duplicidade independentemente do cliente

#### T17 - Cadastro concorrente da mesma face

- Prioridade: `P0`
- Sistema: `backend-api`
- Passos:
  1. Enviar dois signups simultaneos com mesma imagem facial.
  2. Validar se apenas um cadastro e aceito.
- Esperado:
  - unicidade garantida no servidor, sem depender de pre-check no frontend

### 5. Relatorios e Liquidacao

#### T18 - Geracao de relatorio com dados validos

- Prioridade: `P1`
- Sistema: `backend-api`, `frontend-web`, `frontend-mobile`
- Passos:
  1. Selecionar projeto valido.
  2. Selecionar BOM.
  3. Informar periodo valido.
  4. Executar relatorio.
- Esperado:
  - job criado
  - progresso evolui ate `completed`
  - arquivo e baixado ou compartilhado

#### T19 - Relatorio sem invoices

- Prioridade: `P1`
- Sistema: `backend-api`, `frontend-web`, `frontend-mobile`
- Passos:
  1. Rodar relatorio em projeto sem invoices.
- Esperado:
  - erro claro e consistente
  - nenhum arquivo gerado

#### T20 - Relatorio sem POs

- Prioridade: `P1`
- Sistema: `backend-api`, `frontend-web`, `frontend-mobile`
- Passos:
  1. Rodar relatorio em empresa sem POs.
- Esperado:
  - erro claro e consistente

#### T21 - Reinicio do backend durante job de relatorio

- Prioridade: `P0`
- Sistema: `backend-api`, `frontend-web`, `frontend-mobile`
- Passos:
  1. Iniciar job de relatorio.
  2. Reiniciar o backend antes da conclusao.
  3. Consultar status e tentar download.
- Esperado:
  - job deveria sobreviver ou falhar de forma controlada
  - cliente deve informar ao usuario o que ocorreu

#### T22 - Execucoes concorrentes de relatorio para mesma empresa e projeto

- Prioridade: `P1`
- Sistema: `backend-api`
- Passos:
  1. Disparar dois jobs simultaneos para o mesmo projeto.
  2. Verificar saldos remanescentes e resultados persistidos.
- Esperado:
  - sem corrupcao de saldos
  - sem sobrescrita inconsistente

#### T23 - Validacao do Excel gerado

- Prioridade: `P1`
- Sistema: `backend-api`, `frontend-web`, `frontend-mobile`
- Passos:
  1. Baixar o Excel.
  2. Conferir cabecalhos, nome do arquivo, colunas, valores e datas.
- Esperado:
  - arquivo legivel
  - nomes consistentes
  - quantidades e monetarios corretos

### 6. Resiliencia e Persistencia

#### T24 - Falha total dos bancos externos

- Prioridade: `P0`
- Sistema: `backend-api`
- Passos:
  1. Derrubar banco principal e backup.
  2. Subir a aplicacao.
  3. Criar dados e reiniciar.
- Esperado:
  - o sistema nao deve entrar silenciosamente em modo com perda de dados sem alerta operacional severo

#### T25 - Queda do servico de email

- Prioridade: `P1`
- Sistema: `backend-api`, `frontend-web`, `frontend-mobile`
- Passos:
  1. Derrubar servico de email principal.
  2. Validar tentativa de fallback.
  3. Derrubar ambos e repetir.
- Esperado:
  - fallback executado quando disponivel
  - erro coerente quando indisponivel

#### T26 - Latencia alta ou timeout da API

- Prioridade: `P2`
- Sistema: `frontend-web`, `frontend-mobile`
- Passos:
  1. Simular rede lenta.
  2. Navegar por telas com listagens e rodar relatorio.
- Esperado:
  - loaders corretos
  - mensagens de erro amigaveis
  - nenhum estado travado

### 7. Frontend Web

#### T27 - Sessao expirada redireciona para login

- Prioridade: `P1`
- Sistema: `frontend-web`
- Passos:
  1. Entrar no dashboard.
  2. Invalidar token ou sessao no backend.
  3. Recarregar dados da tela.
- Esperado:
  - limpeza de sessao
  - redirecionamento para `/login`

#### T28 - Camera e login facial no navegador

- Prioridade: `P2`
- Sistema: `frontend-web`
- Passos:
  1. Negar permissao de camera.
  2. Tentar abrir camera novamente.
- Esperado:
  - mensagem clara
  - stream encerrado corretamente

#### T29 - Cadastro com face ja existente no web

- Prioridade: `P1`
- Sistema: `frontend-web`
- Passos:
  1. Tentar cadastrar imagem facial ja usada.
- Esperado:
  - cadastro bloqueado
  - nenhuma sessao indevida persistida

### 8. Frontend Mobile

#### T30 - Sessao expirada no app nativo

- Prioridade: `P0`
- Sistema: `frontend-mobile`
- Passos:
  1. Fazer login no app.
  2. Invalidar a sessao no backend.
  3. Tentar carregar qualquer tela protegida.
- Esperado:
  - app deve limpar sessao e navegar imediatamente para `Entry`

#### T31 - Cadastro facial duplicado no mobile

- Prioridade: `P0`
- Sistema: `frontend-mobile`
- Passos:
  1. Usar face ja cadastrada por outro usuario.
  2. Concluir signup no app.
  3. Testar login facial das duas contas.
- Esperado:
  - backend deve rejeitar o cadastro duplicado

#### T32 - Hidratacao de sessao apos reinicio do app

- Prioridade: `P1`
- Sistema: `frontend-mobile`
- Passos:
  1. Fazer login.
  2. Fechar o app.
  3. Reabrir.
- Esperado:
  - sessao restaurada corretamente
  - se o token estiver ausente, usuario deve voltar para `Entry`

### 9. Integridade de Dados

#### T33 - Exclusao de conta com outra sessao ativa

- Prioridade: `P1`
- Sistema: `backend-api`, `frontend-web`, `frontend-mobile`
- Passos:
  1. Manter duas sessoes do mesmo usuario.
  2. Tentar excluir a conta de uma delas.
- Esperado:
  - operacao bloqueada com mensagem correta

#### T34 - Exclusao de ultima conta da empresa

- Prioridade: `P1`
- Sistema: `backend-api`
- Passos:
  1. Excluir a ultima conta de uma empresa.
  2. Verificar limpeza de company, projetos, BOM, invoices, POs e liquidation results.
- Esperado:
  - limpeza consistente e transacional

#### T35 - Concorrencia em create/update de projeto com mesmo nome

- Prioridade: `P1`
- Sistema: `backend-api`
- Passos:
  1. Disparar criacao ou update simultaneo com o mesmo nome dentro da mesma empresa.
- Esperado:
  - nao haver duplicidade
  - resposta consistente sob concorrencia

## Checklist de Evidencias por Bug

Para cada bug confirmado, registrar:

- componente afetado
- endpoint ou tela
- severidade
- pre-condicao
- passos exatos
- resultado esperado
- resultado obtido
- payload e resposta HTTP
- print, log ou dump SQL

## Regressao Minima Antes de Release

Executar obrigatoriamente:

- `T01`, `T02`, `T03`, `T04`
- `T06`, `T07`, `T08`, `T09`
- `T10`, `T11`, `T12`, `T13`
- `T16`, `T17`
- `T18`, `T19`, `T20`, `T21`, `T22`, `T23`
- `T24`, `T25`
- `T27`, `T30`, `T33`, `T34`

## Observacao Final

Os casos acima priorizam os pontos de maior risco tecnico observados na revisao atual. Se o sistema passar por mudancas em autenticacao, modelo de dados, relatorios ou onboarding facial, este plano deve ser revisado antes da proxima rodada de QA.

## Links Uteis

- Atividades separadas por semana para chegar no resultado: `https://app.notion.com/p/Main-Project-Progress-30e83df511ae80a2afe2f4023cf2f59c?source=copy_link`
- Backup: `https://drive.google.com/drive/folders/18qyG-tZ395gJhmbnAK0SEfywt3EJysKK`
