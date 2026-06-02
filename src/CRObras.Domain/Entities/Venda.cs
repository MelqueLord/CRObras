using CRObras.Domain.Enums;

namespace CRObras.Domain.Entities;

public class Venda
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ObraId { get; set; }
    public Obra Obra { get; set; } = null!;
    public TipoVenda Tipo { get; set; }
    public decimal ValorTotalNegociado { get; set; }
    public decimal ValorEntrada { get; set; }
    public DateOnly DataVenda { get; set; }
    public string CompradorNome { get; set; } = string.Empty;
    public string? CompradorDocumento { get; set; }
    public string? Observacao { get; set; }
    public StatusVenda Status { get; set; } = StatusVenda.Aberta;

    public ICollection<ParcelaReceber> Parcelas { get; set; } = [];
    public ICollection<AtivoPermuta> Permutas { get; set; } = [];
}
