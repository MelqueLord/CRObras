using CRObras.Domain.Enums;

namespace CRObras.Application.Vendas;

public record ParcelaRequest(int Numero, decimal Valor, DateOnly DataVencimento);
public record CriarVendaRequest(TipoVenda Tipo, decimal ValorTotalNegociado, decimal ValorEntrada, DateOnly DataVenda, string CompradorNome, string? CompradorDocumento, string? Observacao, IReadOnlyCollection<ParcelaRequest> Parcelas);
public record PermutaRequest(TipoAtivoPermuta Tipo, string Descricao, decimal ValorEstimado, string? DocumentoReferencia, DateOnly DataRecebimento, StatusAtivoPermuta Status);
public record PagarParcelaRequest(DateOnly DataPagamento);
public record ParcelaResponse(Guid Id, int Numero, decimal Valor, DateOnly DataVencimento, DateOnly? DataPagamento, StatusParcela Status);
public record PermutaResponse(Guid Id, TipoAtivoPermuta Tipo, string Descricao, decimal ValorEstimado, DateOnly DataRecebimento, StatusAtivoPermuta Status);
public record VendaResponse(Guid Id, Guid ObraId, TipoVenda Tipo, decimal ValorTotalNegociado, decimal ValorEntrada, DateOnly DataVenda, string CompradorNome, StatusVenda Status, IReadOnlyCollection<ParcelaResponse> Parcelas, IReadOnlyCollection<PermutaResponse> Permutas);
