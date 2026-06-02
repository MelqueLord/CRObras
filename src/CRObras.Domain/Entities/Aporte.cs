namespace CRObras.Domain.Entities;

public class Aporte
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ObraId { get; set; }
    public Obra Obra { get; set; } = null!;
    public Guid SocioId { get; set; }
    public Socio Socio { get; set; } = null!;
    public Guid MovimentacaoFinanceiraId { get; set; }
    public MovimentacaoFinanceira MovimentacaoFinanceira { get; set; } = null!;
    public decimal Valor { get; set; }
    public DateOnly DataAporte { get; set; }
}
