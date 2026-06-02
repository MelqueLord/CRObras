using CRObras.Domain.Enums;

namespace CRObras.Domain.Entities;

public class ParcelaReceber
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid VendaId { get; set; }
    public Venda Venda { get; set; } = null!;
    public Guid ObraId { get; set; }
    public Obra Obra { get; set; } = null!;
    public int Numero { get; set; }
    public decimal Valor { get; set; }
    public DateOnly DataVencimento { get; set; }
    public DateOnly? DataPagamento { get; set; }
    public StatusParcela Status { get; set; } = StatusParcela.Pendente;
    public Guid? MovimentacaoFinanceiraId { get; set; }
    public MovimentacaoFinanceira? MovimentacaoFinanceira { get; set; }
}
