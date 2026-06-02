using CRObras.Application;
using CRObras.Application.Encerramento;
using CRObras.Application.Financeiro;
using CRObras.Application.Obras;
using CRObras.Application.Socios;
using CRObras.Application.Vendas;
using CRObras.Domain.Enums;
using CRObras.Domain.Exceptions;
using CRObras.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CRObras.Tests;

public sealed class FinanceiroTests
{
    [Fact]
    public async Task Aporte_e_despesa_atualizam_saldo_isolado_da_obra()
    {
        await using var db = CreateDbContext();
        var service = new CRObrasService(db);
        var (obraId, socioId) = await CriarObraComSocioAsync(service);

        await service.RegistrarAporteAsync(obraId, new AporteRequest(socioId, 20000, new DateOnly(2026, 1, 10), null), CancellationToken.None);
        await service.RegistrarDespesaAsync(obraId, new DespesaRequest(CategoriaDespesa.Material, 7500, new DateOnly(2026, 1, 11), "Material base", null, null), CancellationToken.None);

        var resumo = await service.ObterResumoFinanceiroAsync(obraId, CancellationToken.None);

        Assert.Equal(12500, resumo.SaldoAtual);
        Assert.Equal(20000, resumo.TotalInvestido);
        Assert.Equal(7500, resumo.TotalGasto);
    }

    [Fact]
    public async Task Permuta_entra_no_resultado_economico_sem_alterar_caixa()
    {
        await using var db = CreateDbContext();
        var service = new CRObrasService(db);
        var (obraId, _) = await CriarObraComSocioAsync(service);

        var venda = await service.CriarVendaAsync(obraId, new CriarVendaRequest(
            TipoVenda.Mista,
            250000,
            50000,
            new DateOnly(2026, 3, 1),
            "Comprador",
            null,
            null,
            []), CancellationToken.None);
        await service.AdicionarPermutaAsync(venda.Id, new PermutaRequest(TipoAtivoPermuta.Terreno, "Terreno recebido", 120000, null, new DateOnly(2026, 3, 1), StatusAtivoPermuta.Recebido), CancellationToken.None);

        var resumo = await service.ObterResumoFinanceiroAsync(obraId, CancellationToken.None);

        Assert.Equal(50000, resumo.SaldoAtual);
        Assert.Equal(120000, resumo.ValorPermutasEstimado);
        Assert.Equal(170000, resumo.ResultadoEconomico);
    }

    [Fact]
    public async Task Encerramento_bloqueia_novas_movimentacoes()
    {
        await using var db = CreateDbContext();
        var service = new CRObrasService(db);
        var (obraId, socioId) = await CriarObraComSocioAsync(service);

        await service.RegistrarAporteAsync(obraId, new AporteRequest(socioId, 10000, new DateOnly(2026, 1, 1), null), CancellationToken.None);
        await service.EncerrarObraAsync(obraId, new EncerrarObraRequest("Fechamento teste"), CancellationToken.None);

        await Assert.ThrowsAsync<DomainException>(() => service.RegistrarDespesaAsync(obraId, new DespesaRequest(CategoriaDespesa.Outros, 100, new DateOnly(2026, 1, 2), "Ajuste indevido", null, null), CancellationToken.None));
    }

    private static async Task<(Guid ObraId, Guid SocioId)> CriarObraComSocioAsync(CRObrasService service)
    {
        var obra = await service.CriarObraAsync(new ObraRequest("Casa teste", null, null, new DateOnly(2026, 1, 1), null, ObraStatus.EmAndamento), CancellationToken.None);
        var socio = await service.CriarSocioAsync(new SocioRequest("Joao", "123", "joao@example.com", null, true), CancellationToken.None);
        await service.VincularSocioAsync(obra.Id, new ObraSocioRequest(socio.Id, 100, null), CancellationToken.None);
        return (obra.Id, socio.Id);
    }

    private static AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }
}
