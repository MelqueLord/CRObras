using CRObras.Application;
using CRObras.Application.Encerramento;
using CRObras.Application.Financeiro;
using CRObras.Application.Obras;
using CRObras.Application.Vendas;
using CRObras.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CRObras.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/obras")]
public sealed class ObrasController(CRObrasService service) : ControllerBase
{
    [HttpGet]
    public async Task<IReadOnlyCollection<ObraResponse>> Listar([FromQuery] ObraStatus? status, CancellationToken ct) => await service.ListarObrasAsync(status, ct);

    [HttpPost]
    public async Task<ActionResult<ObraResponse>> Criar(ObraRequest request, CancellationToken ct) => Created("", await service.CriarObraAsync(request, ct));

    [HttpGet("{id:guid}")]
    public async Task<ObraResponse> Obter(Guid id, CancellationToken ct) => await service.ObterObraAsync(id, ct);

    [HttpPut("{id:guid}")]
    public async Task<ObraResponse> Atualizar(Guid id, ObraRequest request, CancellationToken ct) => await service.AtualizarObraAsync(id, request, ct);

    [HttpGet("{id:guid}/socios")]
    public async Task<IReadOnlyCollection<ObraSocioResponse>> ListarSocios(Guid id, CancellationToken ct) => await service.ListarSociosDaObraAsync(id, ct);

    [HttpPost("{id:guid}/socios")]
    public async Task<ObraSocioResponse> VincularSocio(Guid id, ObraSocioRequest request, CancellationToken ct) => await service.VincularSocioAsync(id, request, ct);

    [HttpPut("{id:guid}/socios/{socioId:guid}")]
    public async Task<ObraSocioResponse> AtualizarSocio(Guid id, Guid socioId, ObraSocioRequest request, CancellationToken ct) => await service.AtualizarSocioDaObraAsync(id, socioId, request, ct);

    [HttpGet("{id:guid}/resumo-financeiro")]
    public async Task<ResumoFinanceiroResponse> Resumo(Guid id, CancellationToken ct) => await service.ObterResumoFinanceiroAsync(id, ct);

    [HttpGet("{id:guid}/movimentacoes")]
    public async Task<IReadOnlyCollection<MovimentacaoResponse>> Movimentacoes(Guid id, CancellationToken ct) => await service.ListarMovimentacoesAsync(id, ct);

    [HttpPost("{id:guid}/aportes")]
    public async Task<MovimentacaoResponse> Aporte(Guid id, AporteRequest request, CancellationToken ct) => await service.RegistrarAporteAsync(id, request, ct);

    [HttpPost("{id:guid}/despesas")]
    public async Task<MovimentacaoResponse> Despesa(Guid id, DespesaRequest request, CancellationToken ct) => await service.RegistrarDespesaAsync(id, request, ct);

    [HttpPost("{id:guid}/movimentacoes/{movimentacaoId:guid}/cancelar")]
    public async Task<MovimentacaoResponse> CancelarMovimentacao(Guid id, Guid movimentacaoId, CancellationToken ct) => await service.CancelarMovimentacaoAsync(id, movimentacaoId, ct);

    [HttpPost("{id:guid}/venda")]
    public async Task<VendaResponse> CriarVenda(Guid id, CriarVendaRequest request, CancellationToken ct) => await service.CriarVendaAsync(id, request, ct);

    [HttpGet("{id:guid}/venda")]
    public async Task<VendaResponse> ObterVenda(Guid id, CancellationToken ct) => await service.ObterVendaPorObraAsync(id, ct);

    [HttpGet("{id:guid}/pre-fechamento")]
    public async Task<PreFechamentoResponse> PreFechamento(Guid id, CancellationToken ct) => await service.ObterPreFechamentoAsync(id, ct);

    [HttpPost("{id:guid}/encerrar")]
    public async Task<EncerramentoResponse> Encerrar(Guid id, EncerrarObraRequest request, CancellationToken ct) => await service.EncerrarObraAsync(id, request, ct);
}
