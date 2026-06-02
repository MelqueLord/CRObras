# CRObras

Aplicacao web simples para controle financeiro de obras imobiliarias com caixa isolado por obra.

## Stack

- Backend: ASP.NET Core 8, EF Core, PostgreSQL, Identity, JWT
- Frontend: React, TypeScript, Vite, Tailwind
- Arquitetura: monolito modular com Clean Architecture simplificada

## Como Rodar

1. Suba um PostgreSQL local com:

```bash
docker compose up -d
```

2. Aplique a migration:

```bash
dotnet ef database update --project src/CRObras.Infrastructure --startup-project src/CRObras.Api
```

3. Rode a API:

```bash
dotnet run --project src/CRObras.Api
```

4. Rode o frontend, quando Node/NPM estiver instalado:

```bash
cd client
npm install
npm run dev
```

API: `http://localhost:5113`

Frontend: `http://localhost:5173`

Banco PostgreSQL local do projeto: `localhost:5433`

Usuario de desenvolvimento criado automaticamente:

- Email: `admin@crobras.local`
- Senha: `123456`

## Fluxo Principal

1. Criar primeiro usuario na tela de login.
2. Criar obra.
3. Criar socios.
4. Vincular socios a obra com participacao.
5. Registrar aportes e despesas.
6. Registrar venda e permutas.
7. Consultar previa de fechamento.
8. Encerrar obra.

## Validacao

```bash
dotnet build CRObras.sln
dotnet test CRObras.sln
```

## Publicacao

O passo a passo para publicar em Supabase, Render e Vercel esta em [DEPLOY.md](DEPLOY.md).
