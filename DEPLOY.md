# Deploy CRObras

Este guia publica:

- Banco PostgreSQL no Supabase.
- API ASP.NET Core no Render.
- Frontend React/Vite na Vercel.

## 1. Supabase

1. Crie um projeto no Supabase.
2. Acesse `Project Settings > Database > Connect`.
3. Copie a connection string PostgreSQL.
4. Para Render, prefira a string do pooler se a conexao direta IPv6 nao funcionar.
5. Converta a string para formato Npgsql, por exemplo:

```text
Host=aws-0-us-east-1.pooler.supabase.com;Port=6543;Database=postgres;Username=postgres.SEUPROJECTREF;Password=SUA_SENHA;SSL Mode=Require;Trust Server Certificate=true
```

As migrations do EF Core serao aplicadas automaticamente pela API quando `ApplyMigrations=true`.

## 2. Render

1. Suba este repositorio para o GitHub.
2. No Render, crie um Blueprint a partir do arquivo `render.yaml`, ou crie um Web Service Docker manualmente.
3. Se criar manualmente:
   - Runtime: Docker.
   - Dockerfile path: `./src/CRObras.Api/Dockerfile`.
   - Docker context: `.`.
   - Health check path: `/health`.
4. Configure as variaveis de ambiente:

```text
ASPNETCORE_ENVIRONMENT=Production
ApplyMigrations=true
Jwt__Issuer=CRObras
Jwt__Audience=CRObras.Web
Jwt__Key=gere-uma-chave-segura-com-mais-de-32-caracteres
Auth__RegistrationCode=gere-um-codigo-privado-para-criar-usuarios
ConnectionStrings__DefaultConnection=connection-string-do-supabase-em-formato-npgsql
FrontendOrigins=https://seu-frontend.vercel.app
```

5. Faca o deploy.
6. Ao finalizar, teste:

```bash
curl https://sua-api.onrender.com/health
```

Deve retornar:

```text
Healthy
```

## 3. Vercel

1. Importe o mesmo repositorio na Vercel.
2. Configure o projeto usando a pasta `client` como root directory.
3. Confirme:
   - Framework: Vite.
   - Install command: `npm ci`.
   - Build command: `npm run build`.
   - Output directory: `dist`.
4. Configure a variavel:

```text
VITE_API_URL=https://sua-api.onrender.com
```

5. Faca o deploy.

## 4. Ajuste final de CORS

Depois que a Vercel gerar a URL final, volte no Render e ajuste:

```text
FrontendOrigins=https://seu-frontend.vercel.app
```

Se tiver mais de uma origem, separe por virgula:

```text
FrontendOrigins=https://seu-frontend.vercel.app,https://www.seu-dominio.com
```

Depois disso, redeploy/restart a API no Render.

## 5. Criar primeiro usuario

Em producao, acesse o frontend e use a opcao `Criar primeiro usuario` na tela de login.

Informe o mesmo codigo configurado em `Auth__RegistrationCode`.

Guarde essas credenciais com cuidado. O seed automatico `admin@crobras.local / 123456` roda apenas em desenvolvimento local.

## 6. Checklist de validacao

- Supabase criado e connection string copiada.
- Render API com `/health` retornando `Healthy`.
- Vercel com `VITE_API_URL` apontando para a API Render.
- Render com `FrontendOrigins` apontando para a URL da Vercel.
- Login/registro funcionando.
- Criacao de obra funcionando.
- Extrato, aportes e despesas funcionando.
