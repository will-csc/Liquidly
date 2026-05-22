# Documentacao Tecnica

## 1. Visao Geral

A `Liquidly` e uma plataforma multiaplicacao para consolidar, cruzar e analisar dados de:

- `Invoice`
- `PO` (Purchase Order)
- `BOM` (Bill of Materials)

O objetivo do produto e permitir que empresas identifiquem divergencias entre pedido de compra, nota fiscal e estrutura de materiais, gerando apoio para:

- controle de consumo
- analise de liquidacao
- rastreabilidade por projeto
- exportacao de relatorios

## 2. Escopo do Repositorio

O repositorio esta organizado como um monorepo com quatro blocos principais:

- `backend-api/`: API REST em Spring Boot
- `frontend-web/`: aplicacao web em React + Vite
- `frontend-mobile/`: app mobile em Expo/React Native
- `services/email-service/`: microservico Python para envio de e-mails e relatorios

Documentos complementares:

- `docs/structure.md`
- `docs/running-locally.md`
- `docs/docker-ec2.md`

## 3. Arquitetura Logica

### 3.1 Backend

O backend segue uma estrutura classica em camadas:

- `controller`: recebe requests HTTP e devolve responses JSON
- `service`: implementa regras de negocio
- `repository`: acesso a dados com Spring Data JPA
- `model`: entidades persistidas no banco
- `dto`: contratos de entrada e saida
- `exception`: tratamento centralizado de erros
- `security`: JWT, filtro de autenticacao e configuracao de seguranca

### 3.2 Frontend Web

O frontend web oferece o painel operacional e analitico do produto. Ele consome a API REST e concentra:

- login e autenticacao
- CRUD de projetos, BOM, POs, invoices e conversoes
- disparo do processo de liquidacao
- geracao e download de relatorios
- dashboard e navegacao administrativa

### 3.3 Frontend Mobile

O app mobile replica os principais fluxos de consulta e operacao em uma interface adaptada para uso em campo ou consulta rapida.

### 3.4 Email Service

O servico Python e responsavel por:

- envio de e-mail simples
- envio de codigo de recuperacao de senha
- envio de relatorios por e-mail

Ele pode ser chamado pelo backend e roda isolado em container proprio.

## 4. Stack Tecnologica

### 4.1 Backend

- Java 17
- Spring Boot
- Spring Web
- Spring Data JPA
- Spring Security
- JWT
- Maven
- PostgreSQL
- H2 como fallback local

### 4.2 Frontend Web

- React
- TypeScript
- Vite
- Tailwind CSS
- Axios

### 4.3 Frontend Mobile

- Expo
- React Native
- TypeScript
- Axios

### 4.4 Servico Auxiliar

- Python 3
- Flask
- SMTP
- Gunicorn para execucao em container

## 5. Modelo de Dominio

As entidades centrais do sistema sao:

- `Company`: tenant logico da plataforma
- `User`: usuario autenticado, vinculado a uma empresa
- `Project`: agrupador funcional de dados
- `Bom`: materiais previstos por projeto
- `Invoice`: entradas fiscais reais
- `Po`: pedidos de compra
- `Conversion`: regra de conversao entre unidade da invoice e unidade da BOM
- `LiquidationResult`: resultado calculado do cruzamento entre BOM, invoice e PO
- `ReportJob`: job assincrono persistido para geracao de relatorio
- `UserSession`: controle de sessoes autenticadas

## 6. Fluxos de Negocio

### 6.1 Cadastro e autenticacao

1. O usuario faz `signup` ou e criado por fluxo legado.
2. O login por senha ou por face retorna um JWT.
3. O JWT carrega identificacao da sessao.
4. O logout invalida a `sessionId` persistida no backend.

### 6.2 Operacao de dados

1. O usuario cria projetos.
2. O usuario importa ou cadastra BOM, POs, invoices e conversoes.
3. O backend garante escopo por empresa autenticada.
4. A aplicacao consulta os dados por empresa e projeto.

### 6.3 Liquidacao e relatorio

1. O usuario executa a liquidacao de um projeto.
2. O sistema cruza BOM, POs e invoices.
3. O backend gera `LiquidationResult`.
4. O usuario pode iniciar um job assincrono de relatorio.
5. O `ReportJob` fica persistido no banco com status, progresso e arquivo final.
6. O frontend acompanha o status e baixa o Excel quando `downloadReady=true`.

## 7. Seguranca

Os principais mecanismos atuais sao:

- autenticacao por JWT
- controle de sessao persistido
- isolamento de dados por empresa
- validacao de payload com DTOs
- tratamento centralizado de erros
- senha com regras minimas de seguranca
- recuperacao de senha via codigo

Melhorias futuras recomendadas:

- migrar CORS wildcard para origem explicita em todos os ambientes
- adicionar rate limiting para login e recuperacao
- adicionar migrations versionadas de banco
- adicionar observabilidade e auditoria por evento

## 8. Persistencia

O backend usa JPA/Hibernate e tenta conectar na seguinte ordem:

1. datasource primario
2. datasource secundario
3. H2 em memoria

Em ambiente de producao, a estrategia recomendada e:

- usar PostgreSQL como banco oficial
- desabilitar dependencia operacional do H2
- controlar schema com migration

## 9. Jobs de Relatorio

O sistema foi evoluido para nao depender mais de memoria volatil.

Agora os jobs:

- sao gravados na tabela `report_jobs`
- armazenam progresso e mensagens de status
- persistem o arquivo final para download posterior
- sobrevivem a leitura apos reinicio
- sao marcados como falha controlada se o backend reiniciar durante a execucao

Isso aumenta a confiabilidade do fluxo de relatorios em ambiente real.

## 10. Estrategia de Deploy

O backend, banco e email service podem ser executados via Docker Compose.

Arquivos principais:

- `docker-compose.yml`
- `backend-api/Dockerfile`
- `services/email-service/Dockerfile`
- `.env.example`

Topologia prevista:

- `backend-api` exposto na porta `8080`
- `postgres` acessivel apenas na rede interna Docker
- `email-service` acessivel apenas internamente

## 11. Qualidade e Testes

O projeto possui testes automatizados em partes do backend, web e mobile.

Validacoes importantes ja executadas no projeto:

- `mvn test`
- `npm run build` no web
- `npx tsc --noEmit` no mobile

Evolucoes recomendadas:

- pipeline CI com quality gate
- cobertura de testes por modulo
- testes de integracao para autorizacao multi-tenant
- testes de contrato para API

## 12. Riscos Tecnicos Atuais

Pontos que ainda merecem evolucao para um padrao de producao mais maduro:

- uso de `ddl-auto=update` em vez de migrations formais
- dependencia parcial de payloads legados em alguns endpoints
- necessidade de melhor observabilidade operacional
- falta de pipeline CI/CD documentado

## 13. Roadmap Tecnico Recomendado

Curto prazo:

- criar migrations com Flyway ou Liquibase
- padronizar todos os endpoints com DTOs
- revisar CORS e perfis por ambiente

Medio prazo:

- adicionar CI/CD
- adicionar logs estruturados e metricas
- criar testes de integracao com banco real

Longo prazo:

- separar melhor dominios por modulo
- adicionar fila real para cargas pesadas
- colocar API gateway ou reverse proxy com TLS e rate limiting
