namespace CRObras.Domain.Entities;

public class ObraSocio
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ObraId { get; set; }
    public Obra Obra { get; set; } = null!;
    public Guid SocioId { get; set; }
    public Socio Socio { get; set; } = null!;
    public decimal PercentualParticipacao { get; set; }
    public string? Observacao { get; set; }
}
