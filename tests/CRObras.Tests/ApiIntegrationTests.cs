using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using CRObras.Application.Obras;
using CRObras.Domain.Enums;
using CRObras.Infrastructure.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace CRObras.Tests;

public sealed class ApiIntegrationTests
{
    [Fact]
    public async Task Health_endpoint_retorna_healthy()
    {
        await using var factory = new TestApiFactory();
        var client = factory.CreateClient();

        var response = await client.GetAsync("/health");
        var body = await response.Content.ReadAsStringAsync();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("Healthy", body);
    }

    [Fact]
    public async Task Login_usuario_registrado_retorna_token()
    {
        await using var factory = new TestApiFactory();
        var client = factory.CreateClient();
        var email = $"admin-{Guid.NewGuid():N}@crobras.local";

        var registerResponse = await client.PostAsJsonAsync("/api/auth/register", new
        {
            nome = "Admin Teste",
            email,
            password = "123456"
        });
        registerResponse.EnsureSuccessStatusCode();

        var response = await client.PostAsJsonAsync("/api/auth/login", new
        {
            email,
            password = "123456"
        });
        var detail = await response.Content.ReadAsStringAsync();
        var body = response.IsSuccessStatusCode ? await response.Content.ReadFromJsonAsync<AuthTestResponse>() : null;

        Assert.True(response.StatusCode == HttpStatusCode.OK, detail);
        Assert.False(string.IsNullOrWhiteSpace(body?.Token));
    }

    [Fact]
    public async Task Usuario_autenticado_cria_e_lista_obra()
    {
        await using var factory = new TestApiFactory();
        var client = factory.CreateClient();
        var token = await LoginAsync(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var createResponse = await client.PostAsJsonAsync("/api/obras", new ObraRequest(
            "Obra integracao",
            "Teste de API",
            "Rua Teste",
            new DateOnly(2026, 6, 2),
            null,
            ObraStatus.EmAndamento));
        var obras = await client.GetFromJsonAsync<IReadOnlyCollection<ObraResponse>>("/api/obras");

        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        Assert.Contains(obras!, obra => obra.Nome == "Obra integracao");
    }

    private static async Task<string> LoginAsync(HttpClient client)
    {
        var email = $"usuario-{Guid.NewGuid():N}@crobras.local";
        var registerResponse = await client.PostAsJsonAsync("/api/auth/register", new
        {
            nome = "Usuario Teste",
            email,
            password = "123456"
        });
        registerResponse.EnsureSuccessStatusCode();

        var response = await client.PostAsJsonAsync("/api/auth/login", new
        {
            email,
            password = "123456"
        });
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException(await response.Content.ReadAsStringAsync());
        }
        var body = await response.Content.ReadFromJsonAsync<AuthTestResponse>();
        return body!.Token;
    }

    private sealed record AuthTestResponse(string Token, DateTime ExpiresAt, string Nome, string Email);
}

public sealed class TestApiFactory : WebApplicationFactory<Program>
{
    private readonly InMemoryDatabaseRoot _databaseRoot = new();
    private readonly string _databaseName = $"crobras-tests-{Guid.NewGuid()}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.AddDbContext<AppDbContext>(options =>
                options.UseInMemoryDatabase(_databaseName, _databaseRoot));
        });
    }
}
