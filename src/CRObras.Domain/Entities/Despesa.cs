using CRObras.Domain.Enums;

namespace CRObras.Domain.Entities;

public class Despesa
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ObraId { get; set; }
    public Obra Obra { get; set; } = null!;
    public Guid MovimentacaoFinanceiraId { get; set; }
    public MovimentacaoFinanceira MovimentacaoFinanceira { get; set; } = null!;
    public CategoriaDespesa Categoria { get; set; }
    public string? Fornecedor { get; set; }
    public string? DocumentoFiscal { get; set; }
}
