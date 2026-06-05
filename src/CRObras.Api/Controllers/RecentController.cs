using System.Security.Claims;
using CRObras.Application;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CRObras.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/me/recent-obras")]
public sealed class RecentController(CRObrasService service) : ControllerBase
{
    [HttpGet]
    public async Task<IReadOnlyCollection<Guid>> Listar(CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        return await service.ListarObrasRecentesAsync(userId, ct);
    }

    [HttpPost("{obraId:guid}")]
    public async Task<IActionResult> Registrar(Guid obraId, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        await service.RegistrarObraRecenteAsync(userId, obraId, ct);
        return NoContent();
    }

    [HttpDelete("{obraId:guid}")]
    public async Task<IActionResult> Remover(Guid obraId, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        await service.RemoverObraRecenteAsync(userId, obraId, ct);
        return NoContent();
    }

    [HttpDelete]
    public async Task<IActionResult> Limpar(CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        await service.LimparObrasRecentesAsync(userId, ct);
        return NoContent();
    }
}
