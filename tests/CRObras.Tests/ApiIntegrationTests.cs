using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using CRObras.Application.Encerramento;
using CRObras.Application.Financeiro;
using CRObras.Application.Obras;
using CRObras.Application.Vendas;
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

    [Fact]
    public async Task Usuario_autenticado_gerencia_materiais_da_obra()
    {
        await using var factory = new TestApiFactory();
        var client = factory.CreateClient();
        var token = await LoginAsync(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var obra = await CriarObraAsync(client);
        var fornecedorResponse = await client.PostAsJsonAsync("/api/fornecedores", new FornecedorRequest("Fornecedor Material", null, null, true));
        fornecedorResponse.EnsureSuccessStatusCode();
        var fornecedor = await fornecedorResponse.Content.ReadFromJsonAsync<FornecedorResponse>();

        var createResponse = await client.PostAsJsonAsync($"/api/obras/{obra.Id}/materiais", new MaterialRequest("Cimento", 10, 32.5m, fornecedor!.Id));
        createResponse.EnsureSuccessStatusCode();
        var criado = await createResponse.Content.ReadFromJsonAsync<MaterialResponse>();

        var updateResponse = await client.PutAsJsonAsync($"/api/obras/{obra.Id}/materiais/{criado!.Id}", new MaterialRequest("Cimento CP II", 12, 34.9m, fornecedor.Id));
        updateResponse.EnsureSuccessStatusCode();
        var atualizado = await updateResponse.Content.ReadFromJsonAsync<MaterialResponse>();

        var materiais = await client.GetFromJsonAsync<IReadOnlyCollection<MaterialResponse>>($"/api/obras/{obra.Id}/materiais");
        var catalogo = await client.GetFromJsonAsync<IReadOnlyCollection<MaterialCatalogoResponse>>("/api/obras/materiais/catalogo");
        var deleteResponse = await client.DeleteAsync($"/api/obras/{obra.Id}/materiais/{criado.Id}");
        var materiaisAposRemocao = await client.GetFromJsonAsync<IReadOnlyCollection<MaterialResponse>>($"/api/obras/{obra.Id}/materiais");

        Assert.Equal("Cimento CP II", atualizado!.Nome);
        Assert.Equal(fornecedor.Id, atualizado.FornecedorId);
        Assert.Equal("Fornecedor Material", atualizado.FornecedorNome);
        Assert.Equal(12, atualizado.Quantidade);
        Assert.Equal(34.9m, atualizado.PrecoUnitario);
        Assert.Contains(materiais!, material => material.Id == criado.Id && material.Nome == "Cimento CP II" && material.FornecedorId == fornecedor.Id);
        Assert.Contains(catalogo!, material => material.Nome == "Cimento CP II" && material.PrecoUnitario == 34.9m && material.Usos == 1);
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);
        Assert.DoesNotContain(materiaisAposRemocao!, material => material.Id == criado.Id);
    }

    [Fact]
    public async Task Usuario_autenticado_cria_e_atualiza_fornecedor()
    {
        await using var factory = new TestApiFactory();
        var client = factory.CreateClient();
        var token = await LoginAsync(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var createResponse = await client.PostAsJsonAsync("/api/fornecedores", new FornecedorRequest("Loja Central", "123", "11999990000", true));
        createResponse.EnsureSuccessStatusCode();
        var criado = await createResponse.Content.ReadFromJsonAsync<FornecedorResponse>();

        var updateResponse = await client.PutAsJsonAsync($"/api/fornecedores/{criado!.Id}", new FornecedorRequest("Loja Central Materiais", "123", "11888880000", false));
        updateResponse.EnsureSuccessStatusCode();
        var atualizado = await updateResponse.Content.ReadFromJsonAsync<FornecedorResponse>();
        var fornecedores = await client.GetFromJsonAsync<IReadOnlyCollection<FornecedorResponse>>("/api/fornecedores");

        Assert.Equal("Loja Central Materiais", atualizado!.Nome);
        Assert.Equal("11888880000", atualizado.Telefone);
        Assert.False(atualizado.Ativo);
        Assert.Contains(fornecedores!, fornecedor => fornecedor.Id == criado.Id && !fornecedor.Ativo);
    }

    [Fact]
    public async Task Usuario_autenticado_remove_atalho_recente_individual()
    {
        await using var factory = new TestApiFactory();
        var client = factory.CreateClient();
        var token = await LoginAsync(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var primeiraObra = await CriarObraAsync(client, "Obra recente A");
        var segundaObra = await CriarObraAsync(client, "Obra recente B");

        var primeiroRegistro = await client.PostAsync($"/api/me/recent-obras/{primeiraObra.Id}", null);
        var segundoRegistro = await client.PostAsync($"/api/me/recent-obras/{segundaObra.Id}", null);
        var removerResponse = await client.DeleteAsync($"/api/me/recent-obras/{primeiraObra.Id}");
        var recentes = await client.GetFromJsonAsync<IReadOnlyCollection<Guid>>("/api/me/recent-obras");
        var limparResponse = await client.DeleteAsync("/api/me/recent-obras");
        var recentesDepoisDeLimpar = await client.GetFromJsonAsync<IReadOnlyCollection<Guid>>("/api/me/recent-obras");

        Assert.Equal(HttpStatusCode.NoContent, primeiroRegistro.StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, segundoRegistro.StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, removerResponse.StatusCode);
        Assert.Contains(segundaObra.Id, recentes!);
        Assert.DoesNotContain(primeiraObra.Id, recentes!);
        Assert.Equal(HttpStatusCode.NoContent, limparResponse.StatusCode);
        Assert.Empty(recentesDepoisDeLimpar!);
    }

    [Fact]
    public async Task Usuario_autenticado_atualiza_status_da_permuta()
    {
        await using var factory = new TestApiFactory();
        var client = factory.CreateClient();
        var token = await LoginAsync(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var obra = await CriarObraAsync(client, "Obra com permuta");

        var vendaResponse = await client.PostAsJsonAsync($"/api/obras/{obra.Id}/venda", new CriarVendaRequest(
            TipoVenda.Mista,
            250000,
            50000,
            new DateOnly(2026, 6, 5),
            "Comprador Permuta",
            null,
            null,
            []));
        vendaResponse.EnsureSuccessStatusCode();
        var venda = await vendaResponse.Content.ReadFromJsonAsync<VendaResponse>();

        var permutaResponse = await client.PostAsJsonAsync($"/api/vendas/{venda!.Id}/permutas", new PermutaRequest(
            TipoAtivoPermuta.Terreno,
            "Terreno recebido",
            120000,
            null,
            new DateOnly(2026, 6, 5),
            StatusAtivoPermuta.Pendente));
        permutaResponse.EnsureSuccessStatusCode();
        var permuta = await permutaResponse.Content.ReadFromJsonAsync<PermutaResponse>();

        var updateResponse = await client.PutAsJsonAsync($"/api/permutas/{permuta!.Id}/status", new AtualizarStatusPermutaRequest(StatusAtivoPermuta.Recebido));
        updateResponse.EnsureSuccessStatusCode();
        var atualizada = await updateResponse.Content.ReadFromJsonAsync<PermutaResponse>();
        var resumo = await client.GetFromJsonAsync<ResumoFinanceiroResponse>($"/api/obras/{obra.Id}/resumo-financeiro");

        Assert.Equal(StatusAtivoPermuta.Pendente, permuta.Status);
        Assert.Equal(StatusAtivoPermuta.Recebido, atualizada!.Status);
        Assert.Equal(120000, resumo!.ValorPermutasEstimado);
    }

    [Fact]
    public async Task Usuario_autenticado_atualiza_dados_da_permuta()
    {
        await using var factory = new TestApiFactory();
        var client = factory.CreateClient();
        var token = await LoginAsync(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var obra = await CriarObraAsync(client, "Obra com permuta editavel");

        var vendaResponse = await client.PostAsJsonAsync($"/api/obras/{obra.Id}/venda", new CriarVendaRequest(
            TipoVenda.Mista,
            250000,
            50000,
            new DateOnly(2026, 6, 5),
            "Comprador Permuta Editavel",
            null,
            null,
            []));
        vendaResponse.EnsureSuccessStatusCode();
        var venda = await vendaResponse.Content.ReadFromJsonAsync<VendaResponse>();
        var permutaResponse = await client.PostAsJsonAsync($"/api/vendas/{venda!.Id}/permutas", new PermutaRequest(
            TipoAtivoPermuta.Terreno,
            "Terreno antigo",
            120000,
            null,
            new DateOnly(2026, 6, 5),
            StatusAtivoPermuta.Pendente));
        permutaResponse.EnsureSuccessStatusCode();
        var permuta = await permutaResponse.Content.ReadFromJsonAsync<PermutaResponse>();

        var updateResponse = await client.PutAsJsonAsync($"/api/permutas/{permuta!.Id}", new AtualizarPermutaRequest(
            TipoAtivoPermuta.Imovel,
            "Apartamento recebido",
            140000,
            "MATR-123",
            new DateOnly(2026, 8, 10),
            StatusAtivoPermuta.Recebido));
        updateResponse.EnsureSuccessStatusCode();
        var atualizada = await updateResponse.Content.ReadFromJsonAsync<PermutaResponse>();
        var resumo = await client.GetFromJsonAsync<ResumoFinanceiroResponse>($"/api/obras/{obra.Id}/resumo-financeiro");

        Assert.Equal(TipoAtivoPermuta.Imovel, atualizada!.Tipo);
        Assert.Equal("Apartamento recebido", atualizada.Descricao);
        Assert.Equal(140000, atualizada.ValorEstimado);
        Assert.Equal(new DateOnly(2026, 8, 10), atualizada.DataRecebimento);
        Assert.Equal(StatusAtivoPermuta.Recebido, atualizada.Status);
        Assert.Equal(140000, resumo!.ValorPermutasEstimado);
    }

    [Fact]
    public async Task Usuario_autenticado_atualiza_dados_basicos_da_venda()
    {
        await using var factory = new TestApiFactory();
        var client = factory.CreateClient();
        var token = await LoginAsync(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var obra = await CriarObraAsync(client, "Obra com venda editavel");

        var vendaResponse = await client.PostAsJsonAsync($"/api/obras/{obra.Id}/venda", new CriarVendaRequest(
            TipoVenda.Dinheiro,
            200000,
            10000,
            new DateOnly(2026, 6, 5),
            "Comprador Original",
            null,
            null,
            []));
        vendaResponse.EnsureSuccessStatusCode();

        var updateResponse = await client.PutAsJsonAsync($"/api/obras/{obra.Id}/venda", new AtualizarVendaRequest(
            TipoVenda.Mista,
            220000,
            new DateOnly(2026, 7, 1),
            "Comprador Atualizado"));
        updateResponse.EnsureSuccessStatusCode();
        var atualizada = await updateResponse.Content.ReadFromJsonAsync<VendaResponse>();

        Assert.Equal(TipoVenda.Mista, atualizada!.Tipo);
        Assert.Equal(220000, atualizada.ValorTotalNegociado);
        Assert.Equal(10000, atualizada.ValorEntrada);
        Assert.Equal(new DateOnly(2026, 7, 1), atualizada.DataVenda);
        Assert.Equal("Comprador Atualizado", atualizada.CompradorNome);
    }

    [Fact]
    public async Task Usuario_autenticado_cancela_parcela_pendente()
    {
        await using var factory = new TestApiFactory();
        var client = factory.CreateClient();
        var token = await LoginAsync(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var obra = await CriarObraAsync(client, "Obra com parcela cancelada");

        var vendaResponse = await client.PostAsJsonAsync($"/api/obras/{obra.Id}/venda", new CriarVendaRequest(
            TipoVenda.Parcelada,
            100000,
            0,
            new DateOnly(2026, 6, 5),
            "Comprador Parcela",
            null,
            null,
            [new ParcelaRequest(1, 100000, new DateOnly(2026, 7, 5))]));
        vendaResponse.EnsureSuccessStatusCode();
        var venda = await vendaResponse.Content.ReadFromJsonAsync<VendaResponse>();
        var parcela = venda!.Parcelas.Single();

        var cancelResponse = await client.PostAsync($"/api/parcelas/{parcela.Id}/cancelar", null);
        cancelResponse.EnsureSuccessStatusCode();
        var cancelada = await cancelResponse.Content.ReadFromJsonAsync<ParcelaResponse>();
        var preFechamento = await client.GetFromJsonAsync<PreFechamentoResponse>($"/api/obras/{obra.Id}/pre-fechamento");

        Assert.Equal(StatusParcela.Cancelada, cancelada!.Status);
        Assert.DoesNotContain("Existem parcelas pendentes.", preFechamento!.Pendencias);
    }

    [Fact]
    public async Task Usuario_autenticado_atualiza_parcela_pendente()
    {
        await using var factory = new TestApiFactory();
        var client = factory.CreateClient();
        var token = await LoginAsync(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var obra = await CriarObraAsync(client, "Obra com parcela editavel");

        var vendaResponse = await client.PostAsJsonAsync($"/api/obras/{obra.Id}/venda", new CriarVendaRequest(
            TipoVenda.Parcelada,
            100000,
            0,
            new DateOnly(2026, 6, 5),
            "Comprador Edicao Parcela",
            null,
            null,
            [new ParcelaRequest(1, 100000, new DateOnly(2026, 7, 5))]));
        vendaResponse.EnsureSuccessStatusCode();
        var venda = await vendaResponse.Content.ReadFromJsonAsync<VendaResponse>();
        var parcela = venda!.Parcelas.Single();

        var updateResponse = await client.PutAsJsonAsync($"/api/parcelas/{parcela.Id}", new AtualizarParcelaRequest(95000, new DateOnly(2026, 8, 10)));
        updateResponse.EnsureSuccessStatusCode();
        var atualizada = await updateResponse.Content.ReadFromJsonAsync<ParcelaResponse>();

        Assert.Equal(95000, atualizada!.Valor);
        Assert.Equal(new DateOnly(2026, 8, 10), atualizada.DataVencimento);
        Assert.Equal(StatusParcela.Pendente, atualizada.Status);
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

    private static async Task<ObraResponse> CriarObraAsync(HttpClient client, string nome = "Obra materiais")
    {
        var response = await client.PostAsJsonAsync("/api/obras", new ObraRequest(
            nome,
            "Teste de materiais",
            "Rua Teste",
            new DateOnly(2026, 6, 5),
            null,
            ObraStatus.EmAndamento));
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<ObraResponse>())!;
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
