# Documentacao Operacional

## 1. Objetivo

Este documento descreve como operar a stack da `Liquidly` em ambiente local e tambem registra a topologia atualmente publicada.

Escopo deste runbook:

- `backend-api`
- `postgres`
- `email-service`
- `frontend-web`

Topologia atual publicada:

- `frontend-web` na Vercel
- `backend-api` no Render
- `email-service` Python na AWS
- banco PostgreSQL principal no Neon

## 2. Componentes Operacionais

### 2.0 Mapa de Hospedagem Atual

Distribuicao atual por provedor:

- Vercel: frontend web publico
- Render: backend API publico
- AWS: servico Python de e-mail/apoio
- Neon: banco PostgreSQL principal

URLs publicas atuais:

- frontend web: `https://liquidly.vercel.app`
- backend API: `https://liquidly-backend.onrender.com`

### 2.1 Backend API

Responsavel por:

- autenticacao
- CRUD de dados do produto
- liquidacao
- controle de jobs de relatorio
- download de relatorios

Porta padrao:

- `8080`

### 2.2 PostgreSQL

Responsavel por:

- persistencia principal do sistema
- armazenamento de usuarios, projetos, BOM, invoices, POs, resultados e jobs

Porta interna:

- `5432`

### 2.3 Email Service

Responsavel por:

- envio de codigo de recuperacao
- envio de e-mails operacionais

Observacao:

- o download de relatorios fica no `backend-api`, que expoe o arquivo gerado para consumo do frontend

Porta interna:

- `5000`

## 3. Modos de Execucao

### 3.1 Desenvolvimento local

Usado para:

- desenvolvimento funcional
- depuracao
- testes manuais

Pode rodar com:

- PostgreSQL local
- H2 como fallback apenas para desenvolvimento rapido

### 3.2 Docker local

Usado para:

- aproximar o ambiente de producao
- validar integracao entre backend, banco e email service

### 3.3 EC2

Usado para:

- apresentacao
- homologacao
- deploy simples de producao

Observacao:

- no estado atual do projeto, a EC2 nao e a hospedagem principal do backend Java; ela aparece na documentacao como opcao de self-host, enquanto o backend publicado esta no Render e o servico Python esta na AWS

## 4. Pre-requisitos

### 4.1 Local sem Docker

- Java 17
- Maven 3.9+
- Python 3.10+
- Node.js 18+ se quiser rodar frontends
- PostgreSQL opcional

### 4.2 Docker/EC2

- Docker
- Docker Compose Plugin
- acesso ao repositorio
- variaveis de ambiente configuradas

## 5. Variaveis Criticas

As principais variaveis da stack Docker estao em:

- `.env.example`

As mais importantes para producao sao:

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `APP_SECURITY_JWT_SECRET`
- `EMAIL_SERVICE_API_KEY`
- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- `APP_SECURITY_CORS_ALLOWED_ORIGIN_PATTERNS`
- `APP_ENVIRONMENT`

Boas praticas:

- nunca commitar `.env`
- usar senha forte para o banco
- usar JWT secret com 32+ caracteres
- usar API key aleatoria para o email service

## 6. Subida da Stack com Docker

Esta secao descreve a stack alternativa local/self-hosted.



```bash
cp .env.example .env
docker compose up -d --build
```

Verificacao:

```bash
docker compose ps
docker compose logs -f backend-api
docker compose logs -f email-service
```

## 7. Health Checks

### 7.1 Backend

Smoke test simples:

```bash
curl http://localhost:8080/api/users
```

Resultado esperado:

- resposta HTTP do backend
- mesmo que retorne erro de autenticacao ou lista vazia, o servidor deve responder

### 7.2 Email Service

```bash
curl http://localhost:5000/health
```

Se houver `EMAIL_SERVICE_API_KEY`, envie:

```bash
curl -H "X-API-Key: <valor>" http://localhost:5000/health
```

### 7.3 Banco

No container:

```bash
docker exec -it liquidly-postgres psql -U liquidly -d liquidly
```

## 8. Procedimento de Start

### 8.1 Ordem logica

1. PostgreSQL
2. Email service
3. Backend API

No `docker compose` isso ja esta encadeado por `depends_on` com healthcheck.

### 8.2 Comando recomendado

```bash
docker compose up -d --build
```

## 9. Procedimento de Stop

Parada normal:

```bash
docker compose down
```

Parada removendo volume do banco:

```bash
docker compose down -v
```

Use `-v` apenas quando quiser descartar os dados.

## 10. Logs e Diagnostico

### 10.1 Backend

```bash
docker compose logs -f backend-api
```

Procure por:

- inicializacao do Tomcat
- conexao com banco
- erro de autenticacao
- falhas em geracao de relatorio

### 10.2 Email Service

```bash
docker compose logs -f email-service
```

Procure por:

- erro de SMTP
- erro de API key
- erro de conexao com banco

### 10.3 Banco

```bash
docker compose logs -f postgres
```

Procure por:

- falha de credencial
- problema de volume
- corrupcao ou lock

## 11. Runbook de Incidentes

### 11.1 Backend nao sobe

Checklist:

- verificar `docker compose ps`
- verificar logs do backend
- confirmar se o banco esta `healthy`
- validar `APP_SECURITY_JWT_SECRET`
- validar URLs e credenciais do datasource

### 11.2 Email service nao envia e-mail

Checklist:

- validar `SMTP_USERNAME`
- validar `SMTP_PASSWORD`
- validar `SMTP_SERVER` e `SMTP_PORT`
- validar `EMAIL_SERVICE_API_KEY`
- testar endpoint `/health`

### 11.3 Banco inacessivel

Checklist:

- validar credenciais do Postgres
- validar volume do container
- validar se a porta interna esta ocupada
- verificar se o container reiniciou em loop

### 11.4 Relatorio travado ou interrompido

Comportamento esperado atual:

- jobs `queued` ou `running` ficam persistidos
- se o backend reiniciar no meio da execucao, esses jobs passam para `failed` no proximo boot

Acao operacional:

- consultar status do job pela API
- reenviar o processamento se necessario
- verificar logs do backend e do email service

## 12. Backup e Persistencia

Persistencia principal:

- volume Docker `postgres_data`

Recomendacoes:

- backup logico periodico com `pg_dump`
- backup antes de atualizar versao da stack
- nao usar `docker compose down -v` em ambiente real sem backup

Exemplo:

```bash
docker exec -t liquidly-postgres pg_dump -U liquidly liquidly > backup.sql
```

## 13. Atualizacao de Versao

Fluxo recomendado:

1. fazer backup do banco
2. atualizar codigo do repositorio
3. revisar `.env`
4. rebuildar imagens
5. subir containers
6. validar health checks

Comandos:

```bash
git pull
docker compose up -d --build
docker compose ps
```

## 14. Operacao em EC2

Recomendacoes para EC2:

- expor publicamente apenas a porta `8080`
- nao expor `5432`
- se usar dominio, colocar Nginx ou ALB na frente
- configurar `APP_SECURITY_CORS_ALLOWED_ORIGIN_PATTERNS` com o dominio real do frontend
- manter `APP_ENVIRONMENT=production`

Importante:

- esta secao representa um modo alternativo de operacao
- a topologia principal atualmente publicada usa `Render` para o backend, `Vercel` para o frontend, `AWS` para o servico Python e `Neon` para o banco

## 15. Checklist de Producao

Antes da banca ou deploy:

- `.env` configurado
- banco persistente ativo
- backend respondendo em `8080`
- email service saudavel
- recuperacao de senha funcional
- fluxo de login funcional
- relatorio gerando e baixando
- logs sem erro critico no boot

## 16. Comandos Uteis

Subir stack:

```bash
docker compose up -d --build
```

Ver status:

```bash
docker compose ps
```

Ver logs do backend:

```bash
docker compose logs -f backend-api
```

Ver logs do email service:

```bash
docker compose logs -f email-service
```

Parar stack:

```bash
docker compose down
```

## 17. Links Uteis

- Atividades separadas por semana para chegar no resultado: `https://app.notion.com/p/Main-Project-Progress-30e83df511ae80a2afe2f4023cf2f59c?source=copy_link`
- Backup: `https://drive.google.com/drive/folders/18qyG-tZ395gJhmbnAK0SEfywt3EJysKK`
