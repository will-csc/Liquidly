# Docker EC2

Este documento sobe apenas a stack de backend da `Liquidly`:

- `backend-api`
- `postgres`
- `email-service`

O frontend web/mobile continua fora desta stack.

## Arquivos

- `docker-compose.yml`
- `.env.example`
- `backend-api/Dockerfile`
- `services/email-service/Dockerfile`

## 1. Preparar a EC2

Instale Docker e Docker Compose Plugin:

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER
```

Depois reconecte na instância para aplicar o grupo `docker`.

## 2. Subir o código

Na EC2:

```bash
git clone <SEU_REPOSITORIO>
cd liquidly-project
cp .env.example .env
```

## 3. Configurar variáveis

Edite o arquivo `.env` e ajuste no mínimo:

- `POSTGRES_PASSWORD`
- `APP_SECURITY_JWT_SECRET`
- `EMAIL_SERVICE_API_KEY`
- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- `APP_SECURITY_CORS_ALLOWED_ORIGIN_PATTERNS`

Recomendação:

- use uma `JWT secret` com 32+ caracteres
- use uma `EMAIL_SERVICE_API_KEY` aleatória
- no security group da EC2, exponha apenas a porta `8080`
- não exponha a porta do PostgreSQL publicamente

## 4. Build e start

```bash
docker compose up -d --build
```

## 5. Verificar containers

```bash
docker compose ps
docker compose logs -f backend-api
docker compose logs -f email-service
```

## 6. Parar a stack

```bash
docker compose down
```

Para manter o banco:

```bash
docker compose down
```

Para remover também o volume do PostgreSQL:

```bash
docker compose down -v
```

## Observações

- O PostgreSQL usa volume nomeado `postgres_data`.
- O backend conversa com o banco via rede interna Docker usando `postgres:5432`.
- O backend conversa com o email service via `http://email-service:5000`.
- O backend continua com `spring.jpa.hibernate.ddl-auto=update`, então cria/atualiza as tabelas ao iniciar.
- Os jobs de relatório agora ficam persistidos no banco e jobs interrompidos por restart são marcados como falha controlada no próximo boot.

## Deploy atrás de domínio

Se você colocar Nginx ou ALB na frente:

- aponte o proxy para `http://<ip-da-ec2>:8080`
- ajuste `APP_SECURITY_CORS_ALLOWED_ORIGIN_PATTERNS` para o domínio real do frontend
- mantenha `APP_ENVIRONMENT=production`
