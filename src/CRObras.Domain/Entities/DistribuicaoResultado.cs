namespace CRObras.Domain.Entities;

public class DistribuicaoResultado
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid EncerramentoObraId { get; set; }
    public EncerramentoObra EncerramentoObra { get; set; } = null!;
    public Guid SocioId { get; set; }
    public Socio Socio { get; set; } = null!;
    public decimal PercentualParticipacao { get; set; }
    public decimal ValorInvestido { get; set; }
    public decimal ValorResultado { get; set; }
    public decimal ValorAReceberOuPagar { get; set; }
}
