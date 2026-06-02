using CRObras.Domain.Enums;

namespace CRObras.Domain.Entities;

public class AtivoPermuta
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid VendaId { get; set; }
    public Venda Venda { get; set; } = null!;
    public Guid ObraId { get; set; }
    public Obra Obra { get; set; } = null!;
    public TipoAtivoPermuta Tipo { get; set; }
    public string Descricao { get; set; } = string.Empty;
    public decimal ValorEstimado { get; set; }
    public string? DocumentoReferencia { get; set; }
    public DateOnly DataRecebimento { get; set; }
    public StatusAtivoPermuta Status { get; set; } = StatusAtivoPermuta.Recebido;
}
