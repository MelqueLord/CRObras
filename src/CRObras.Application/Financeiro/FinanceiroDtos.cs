using CRObras.Domain.Enums;

namespace CRObras.Application.Financeiro;

public record AporteRequest(Guid SocioId, decimal Valor, DateOnly DataAporte, string? Descricao);
public record DespesaRequest(CategoriaDespesa Categoria, decimal Valor, DateOnly DataDespesa, string Descricao, string? Fornecedor, string? DocumentoFiscal);
public record MovimentacaoResponse(Guid Id, Guid ObraId, TipoMovimentacao Tipo, string Categoria, decimal Valor, DateOnly DataMovimentacao, string Descricao, Guid? SocioId, Guid? ParcelaReceberId, StatusMovimentacao Status, DateTimeOffset CriadoEm);
