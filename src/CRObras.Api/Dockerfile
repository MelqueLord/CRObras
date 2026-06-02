FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY CRObras.sln ./
COPY src/CRObras.Domain/CRObras.Domain.csproj src/CRObras.Domain/
COPY src/CRObras.Application/CRObras.Application.csproj src/CRObras.Application/
COPY src/CRObras.Infrastructure/CRObras.Infrastructure.csproj src/CRObras.Infrastructure/
COPY src/CRObras.Api/CRObras.Api.csproj src/CRObras.Api/
RUN dotnet restore src/CRObras.Api/CRObras.Api.csproj

COPY src ./src
RUN dotnet publish src/CRObras.Api/CRObras.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "CRObras.Api.dll"]
