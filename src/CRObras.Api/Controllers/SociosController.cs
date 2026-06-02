using CRObras.Application;
using CRObras.Application.Socios;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CRObras.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/socios")]
public sealed class SociosController(CRObrasService service) : ControllerBase
{
    [HttpGet]
    public async Task<IReadOnlyCollection<SocioResponse>> Listar(CancellationToken ct) => await service.ListarSociosAsync(ct);

    [HttpPost]
    public async Task<ActionResult<SocioResponse>> Criar(SocioRequest request, CancellationToken ct) => Created("", await service.CriarSocioAsync(request, ct));

    [HttpPut("{id:guid}")]
    public async Task<SocioResponse> Atualizar(Guid id, SocioRequest request, CancellationToken ct) => await service.AtualizarSocioAsync(id, request, ct);

    [HttpDelete("{id:guid}")]
    public async Task<SocioRemovalResponse> Remover(Guid id, CancellationToken ct) => await service.RemoverOuInativarSocioAsync(id, ct);
}
