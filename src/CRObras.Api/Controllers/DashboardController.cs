using CRObras.Application;
using CRObras.Application.Dashboard;
using CRObras.Application.Obras;
using CRObras.Application.Socios;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CRObras.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/dashboard")]
public sealed class DashboardController(CRObrasService service) : ControllerBase
{
    [HttpGet("bootstrap")]
    public async Task<BootstrapResponse> Bootstrap(CancellationToken ct)
    {
        var obras = await service.ListarObrasAsync(null, ct);
        var socios = await service.ListarSociosAsync(ct);
        var resumo = await service.ObterDashboardAsync(ct);
        var parcelasPendentes = await service.ListarParcelasPendentesAsync(ct);

        return new BootstrapResponse(obras, socios, resumo, parcelasPendentes);
    }

    [HttpGet("resumo")]
    public async Task<DashboardResumoResponse> Resumo(CancellationToken ct) => await service.ObterDashboardAsync(ct);

    [HttpGet("parcelas-pendentes")]
    public async Task<IReadOnlyCollection<ParcelaPendenteResponse>> ParcelasPendentes(CancellationToken ct) => await service.ListarParcelasPendentesAsync(ct);
}

public record BootstrapResponse(
    IReadOnlyCollection<ObraResponse> Obras,
    IReadOnlyCollection<SocioResponse> Socios,
    DashboardResumoResponse Dashboard,
    IReadOnlyCollection<ParcelaPendenteResponse> ParcelasPendentes);
