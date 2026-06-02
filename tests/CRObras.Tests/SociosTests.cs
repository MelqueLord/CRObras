using CRObras.Application;
using CRObras.Application.Obras;
using CRObras.Application.Socios;
using CRObras.Domain.Enums;
using CRObras.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CRObras.Tests;

public sealed class SociosTests
{
    [Fact]
    public async Task Remove_socio_sem_historico()
    {
        await using var db = CreateDbContext();
        var service = new CRObrasService(db);
        var socio = await service.CriarSocioAsync(new SocioRequest("Socio sem uso", null, null, null, true), CancellationToken.None);

        var result = await service.RemoverOuInativarSocioAsync(socio.Id, CancellationToken.None);

        Assert.Equal("Removido", result.Acao);
        Assert.False(await db.Socios.AnyAsync(s => s.Id == socio.Id));
    }

    [Fact]
    public async Task Inativa_socio_com_historico()
    {
        await using var db = CreateDbContext();
        var service = new CRObrasService(db);
        var obra = await service.CriarObraAsync(new ObraRequest("Obra socio", null, null, new DateOnly(2026, 6, 2), null, ObraStatus.EmAndamento), CancellationToken.None);
        var socio = await service.CriarSocioAsync(new SocioRequest("Socio usado", null, null, null, true), CancellationToken.None);
        await service.VincularSocioAsync(obra.Id, new ObraSocioRequest(socio.Id, 100, null), CancellationToken.None);

        var result = await service.RemoverOuInativarSocioAsync(socio.Id, CancellationToken.None);
        var saved = await db.Socios.FirstAsync(s => s.Id == socio.Id);

        Assert.Equal("Inativado", result.Acao);
        Assert.False(saved.Ativo);
    }

    private static AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }
}
