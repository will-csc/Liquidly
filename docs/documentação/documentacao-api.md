# Documentacao da API

## 1. Visao Geral

Base URL local:

```text
http://localhost:8080
```

Base URL de producao publicada:

```text
https://liquidly-backend.onrender.com
```

Hospedagem atual da solucao:

- frontend web: Vercel
- backend API: Render
- servico Python de e-mail: AWS
- banco PostgreSQL principal: Neon

Prefixo principal:

```text
/api
```

Formato padrao:

- `Content-Type: application/json`
- respostas em JSON, exceto download de relatorio

## 2. Autenticacao

A API utiliza JWT. Os endpoints protegidos devem receber:

```http
Authorization: Bearer <token>
```

O token e obtido em:

- `POST /api/users/login`
- `POST /api/users/login-face`

## 3. Convencoes de Erro

O backend responde com um JSON padrao em caso de erro:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Email is required"
}
```

Codigos comuns:

- `VALIDATION_ERROR`
- `INVALID_CREDENTIALS`
- `REPORT_JOB_NOT_FOUND`
- `REPORT_FILE_NOT_READY`
- `NOT_FOUND`
- `INTERNAL_ERROR`

## 4. Usuarios e Autenticacao

Base:

```text
/api/users
```

### 4.1 Signup

`POST /api/users/signup`

Request:

```json
{
  "name": "William",
  "email": "william@example.com",
  "password": "Senha@123",
  "companyName": "Liquidly Labs",
  "faceImage": "base64-opcional"
}
```

Response:

```json
{
  "id": 1,
  "username": "William",
  "email": "william@example.com",
  "companyId": 10,
  "companyName": "Liquidly Labs"
}
```

### 4.2 Login por senha

`POST /api/users/login`

Request:

```json
{
  "email": "william@example.com",
  "password": "Senha@123"
}
```

Response:

```json
{
  "token": "<jwt>",
  "user": {
    "id": 1,
    "username": "William",
    "email": "william@example.com",
    "companyId": 10,
    "companyName": "Liquidly Labs"
  }
}
```

### 4.3 Login facial

`POST /api/users/login-face`

Request:

```json
{
  "faceImage": "base64-da-imagem"
}
```

### 4.4 Logout

`POST /api/users/logout`

Headers:

```http
Authorization: Bearer <token>
```

Response:

```json
{
  "message": "ok"
}
```

### 4.5 Verificar se e-mail existe

`GET /api/users/exists?email=william@example.com`

Response:

```json
{
  "exists": true
}
```

### 4.6 Enviar codigo de recuperacao

`POST /api/users/recovery/send-code`

Request:

```json
{
  "email": "william@example.com"
}
```

### 4.7 Resetar senha

`POST /api/users/recovery/reset-password`

Request:

```json
{
  "email": "william@example.com",
  "code": "123456",
  "newPassword": "NovaSenha@123"
}
```

### 4.8 Listar usuarios

`GET /api/users`

### 4.9 Buscar usuario por id

`GET /api/users/{id}`

### 4.10 Deletar usuario

`DELETE /api/users/{id}`

Requer `Authorization`.

## 5. Projetos

Base:

```text
/api/projects
```

Payload principal:

```json
{
  "name": "Projeto Mina Norte"
}
```

Endpoints:

- `POST /api/projects`
- `PUT /api/projects/{id}`
- `GET /api/projects`
- `GET /api/projects/company/{companyId}`
- `GET /api/projects/{id}`
- `DELETE /api/projects/{id}`

## 6. BOM

Base:

```text
/api/boms
```

### 6.1 Criar BOM

`POST /api/boms`

Request:

```json
{
  "projectId": 12,
  "projectName": "Projeto Mina Norte",
  "itemCode": "MAT-001",
  "itemName": "Parafuso",
  "umBom": "PC",
  "qntd": 100.0,
  "remainingQntd": 100.0
}
```

Observacao:

- `projectId` precisa pertencer a empresa autenticada
- se `remainingQntd` nao for enviado, o backend usa o valor de `qntd`

### 6.2 Atualizar BOM

`PUT /api/boms/{id}`

O update ainda usa o modelo persistido de `Bom` como payload.

### 6.3 Consultas de BOM

- `GET /api/boms`
- `GET /api/boms/company/{companyId}`
- `GET /api/boms/project/{projectId}`
- `GET /api/boms/{id}`
- `DELETE /api/boms/{id}`

## 7. Invoices

Base:

```text
/api/invoices
```

### 7.1 Criar Invoice

`POST /api/invoices`

Request:

```json
{
  "projectId": 12,
  "itemCode": "MAT-001",
  "invoiceNumber": "NF-2026-0001",
  "country": "BR",
  "invoiceDateString": "2026-05-21",
  "invoiceValue": 15000.50,
  "qntdInvoice": 200.0,
  "umInvoice": "CX",
  "remainingQntd": 200.0
}
```

Observacao:

- `projectId` precisa pertencer a empresa autenticada
- se `remainingQntd` nao for enviado, o backend usa o valor de `qntdInvoice`

### 7.2 Consultas de Invoice

- `GET /api/invoices`
- `GET /api/invoices/company/{companyId}`
- `GET /api/invoices/project/{projectId}`
- `GET /api/invoices/{id}`
- `DELETE /api/invoices/{id}`

## 8. Purchase Orders

Base:

```text
/api/pos
```

Payload principal:

```json
{
  "poNumber": "PO-9001",
  "itemCode": "MAT-001",
  "poValue": 9000.00,
  "qntdInvoice": 120.0,
  "umPo": "CX",
  "remainingQntd": 120.0
}
```

Endpoints:

- `POST /api/pos`
- `GET /api/pos`
- `GET /api/pos/company/{companyId}`
- `GET /api/pos/number/{poNumber}`
- `GET /api/pos/{id}`
- `DELETE /api/pos/{id}`

Observacao:

- a busca por numero agora respeita a empresa autenticada

## 9. Conversoes

Base:

```text
/api/conversions
```

Payload principal:

```json
{
  "itemCode": "MAT-001",
  "qntdInvoice": 1.0,
  "umInvoice": "CX",
  "qntdBom": 10.0,
  "umBom": "PC"
}
```

Endpoints:

- `POST /api/conversions`
- `PUT /api/conversions/{id}`
- `GET /api/conversions`
- `GET /api/conversions/company/{companyId}`
- `GET /api/conversions/company/{companyId}/item/{itemCode}`
- `GET /api/conversions/{id}`
- `DELETE /api/conversions/{id}`

## 10. Liquidation Results

Base:

```text
/api/liquidation-results
```

### 10.1 Executar liquidacao sincrona

`POST /api/liquidation-results/run?companyId=10&projectId=12`

Response:

- lista de `LiquidationResult`

### 10.2 Iniciar relatorio assincrono

`POST /api/liquidation-results/run-report`

Request:

```json
{
  "companyId": 10,
  "projectId": 12,
  "selectedBom": "Projeto Mina Norte",
  "startDate": "2026-05-01",
  "endDate": "2026-05-31"
}
```

Response `202 Accepted`:

```json
{
  "jobId": "b2d4c1aa-1111-2222-3333-0f00aa00bb11",
  "status": "queued",
  "progress": 0,
  "message": "Relatorio entrou na fila de processamento."
}
```

### 10.3 Consultar status do relatorio

`GET /api/liquidation-results/run-report/{jobId}/status?companyId=10`

Response:

```json
{
  "jobId": "b2d4c1aa-1111-2222-3333-0f00aa00bb11",
  "companyId": 10,
  "projectId": 12,
  "status": "running",
  "progress": 65,
  "stage": "Gerando Excel",
  "message": "Processando relatorio",
  "errorMessage": null,
  "downloadReady": false,
  "fileName": null,
  "totalSteps": 100,
  "completedSteps": 65,
  "remainingSteps": 35,
  "startedAt": "2026-05-21T19:00:00Z",
  "updatedAt": "2026-05-21T19:00:15Z",
  "finishedAt": null
}
```

### 10.4 Baixar relatorio

`GET /api/liquidation-results/run-report/{jobId}/download?companyId=10`

Response:

- `200 OK`
- `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- arquivo `.xlsx`

Observacao:

- o backend retorna diretamente o arquivo gerado; nao ha etapa de envio de relatorio pelo servico Python

### 10.5 CRUD de resultados

- `POST /api/liquidation-results`
- `GET /api/liquidation-results`
- `GET /api/liquidation-results/company/{companyId}`
- `GET /api/liquidation-results/project/{projectId}`
- `GET /api/liquidation-results/{id}`
- `DELETE /api/liquidation-results/{id}`

## 11. Exemplo de Fluxo Completo

### 11.1 Autenticar

1. chamar `POST /api/users/login`
2. guardar o `token`

### 11.2 Cadastrar estrutura do projeto

1. criar projeto
2. cadastrar BOM
3. cadastrar POs
4. cadastrar invoices
5. cadastrar conversoes, se necessario

### 11.3 Rodar analise

1. chamar `POST /api/liquidation-results/run`
2. ou iniciar job com `POST /api/liquidation-results/run-report`

### 11.4 Baixar relatorio

1. consultar status ate `downloadReady=true`
2. chamar o endpoint de download do backend para receber o arquivo `.xlsx`

## 12. Observacoes Importantes

- alguns endpoints antigos ainda aceitam entidades JPA como payload
- os endpoints novos de criacao de BOM e invoice usam DTOs mais seguros
- os erros sao normalizados pelo `GlobalExceptionHandler`
- a API foi desenhada para operar em contexto multi-tenant por empresa
- o frontend web publicado consome a API em `https://liquidly-backend.onrender.com`
- o backend esta configurado para priorizar o datasource primario em nuvem antes dos fallbacks locais

## 13. Proximos Passos Recomendados

- publicar OpenAPI/Swagger automaticamente
- padronizar todos os endpoints com DTOs
- versionar a API se houver integracao externa formal
