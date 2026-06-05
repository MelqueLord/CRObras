using CRObras.Application;
using CRObras.Application.Vendas;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CRObras.Api.Controllers;

[ApiController]
[Authorize]
public sealed class VendasController(CRObrasService service) : ControllerBase
{
    [HttpPost("api/vendas/{vendaId:guid}/parcelas")]
    public async Task<IReadOnlyCollection<ParcelaResponse>> AdicionarParcelas(Guid vendaId, IReadOnlyCollection<ParcelaRequest> request, CancellationToken ct) => await service.AdicionarParcelasAsync(vendaId, request, ct);

    [HttpPut("api/parcelas/{parcelaId:guid}")]
    public async Task<ParcelaResponse> AtualizarParcela(Guid parcelaId, AtualizarParcelaRequest request, CancellationToken ct) => await service.AtualizarParcelaAsync(parcelaId, request, ct);

    [HttpPost("api/parcelas/{parcelaId:guid}/pagar")]
    public async Task<ParcelaResponse> PagarParcela(Guid parcelaId, PagarParcelaRequest request, CancellationToken ct) => await service.PagarParcelaAsync(parcelaId, request, ct);

    [HttpPost("api/parcelas/{parcelaId:guid}/cancelar")]
    public async Task<ParcelaResponse> CancelarParcela(Guid parcelaId, CancellationToken ct) => await service.CancelarParcelaAsync(parcelaId, ct);

    [HttpPost("api/parcelas/{parcelaId:guid}/cancelar-pagamento")]
    public async Task<ParcelaResponse> CancelarPagamento(Guid parcelaId, CancellationToken ct) => await service.CancelarPagamentoParcelaAsync(parcelaId, ct);

    [HttpPost("api/vendas/{vendaId:guid}/permutas")]
    public async Task<PermutaResponse> AdicionarPermuta(Guid vendaId, PermutaRequest request, CancellationToken ct) => await service.AdicionarPermutaAsync(vendaId, request, ct);

    [HttpPut("api/permutas/{permutaId:guid}")]
    public async Task<PermutaResponse> AtualizarPermuta(Guid permutaId, AtualizarPermutaRequest request, CancellationToken ct) => await service.AtualizarPermutaAsync(permutaId, request, ct);

    [HttpPut("api/permutas/{permutaId:guid}/status")]
    public async Task<PermutaResponse> AtualizarStatusPermuta(Guid permutaId, AtualizarStatusPermutaRequest request, CancellationToken ct) => await service.AtualizarStatusPermutaAsync(permutaId, request, ct);
}
