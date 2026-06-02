using CRObras.Application;
using CRObras.Application.Dashboard;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CRObras.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/dashboard")]
public sealed class DashboardController(CRObrasService service) : ControllerBase
{
    [HttpGet("resumo")]
    public async Task<DashboardResumoResponse> Resumo(CancellationToken ct) => await service.ObterDashboardAsync(ct);

    [HttpGet("parcelas-pendentes")]
    public async Task<IReadOnlyCollection<ParcelaPendenteResponse>> ParcelasPendentes(CancellationToken ct) => await service.ListarParcelasPendentesAsync(ct);
}
