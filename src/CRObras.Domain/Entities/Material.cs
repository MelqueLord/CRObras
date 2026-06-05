namespace CRObras.Domain.Entities;

public class Material
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ObraId { get; set; }
    public string Nome { get; set; } = string.Empty;
    public decimal Quantidade { get; set; }
    public decimal PrecoUnitario { get; set; }
}
