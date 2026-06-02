using CRObras.Application;
using CRObras.Application.Financeiro;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CRObras.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/fornecedores")]
public sealed class FornecedoresController(CRObrasService service) : ControllerBase
{
    [HttpGet]
    public async Task<IReadOnlyCollection<FornecedorResponse>> Listar(CancellationToken ct) => await service.ListarFornecedoresAsync(ct);

    [HttpPost]
    public async Task<ActionResult<FornecedorResponse>> Criar(FornecedorRequest request, CancellationToken ct) => Created("", await service.CriarFornecedorAsync(request, ct));

    [HttpPut("{id:guid}")]
    public async Task<FornecedorResponse> Atualizar(Guid id, FornecedorRequest request, CancellationToken ct) => await service.AtualizarFornecedorAsync(id, request, ct);
}
