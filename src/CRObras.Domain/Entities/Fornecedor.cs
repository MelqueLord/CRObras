namespace CRObras.Domain.Entities;

public class Fornecedor
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Nome { get; set; } = string.Empty;
    public string? Documento { get; set; }
    public string? Telefone { get; set; }
    public bool Ativo { get; set; } = true;
}
