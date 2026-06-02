namespace CRObras.Domain.Entities;

public class EncerramentoObra
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ObraId { get; set; }
    public Obra Obra { get; set; } = null!;
    public decimal TotalInvestido { get; set; }
    public decimal TotalGasto { get; set; }
    public decimal TotalRecebido { get; set; }
    public decimal ValorPermutasEstimado { get; set; }
    public decimal ResultadoFinanceiro { get; set; }
    public DateTimeOffset DataEncerramento { get; set; } = DateTimeOffset.UtcNow;
    public string? Observacao { get; set; }

    public ICollection<DistribuicaoResultado> Distribuicoes { get; set; } = [];
}
