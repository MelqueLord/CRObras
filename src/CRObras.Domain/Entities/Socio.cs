namespace CRObras.Domain.Entities;

public class Socio
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Nome { get; set; } = string.Empty;
    public string? Documento { get; set; }
    public string? Email { get; set; }
    public string? Telefone { get; set; }
    public bool Ativo { get; set; } = true;

    public ICollection<ObraSocio> Obras { get; set; } = [];
}
