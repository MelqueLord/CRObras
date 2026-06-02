using CRObras.Domain.Enums;

namespace CRObras.Domain.Entities;

public class MovimentacaoFinanceira
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ObraId { get; set; }
    public Obra Obra { get; set; } = null!;
    public TipoMovimentacao Tipo { get; set; }
    public string Categoria { get; set; } = string.Empty;
    public decimal Valor { get; set; }
    public DateOnly DataMovimentacao { get; set; }
    public string Descricao { get; set; } = string.Empty;
    public Guid? SocioId { get; set; }
    public Socio? Socio { get; set; }
    public Guid? ParcelaReceberId { get; set; }
    public ParcelaReceber? ParcelaReceber { get; set; }
    public StatusMovimentacao Status { get; set; } = StatusMovimentacao.Confirmada;
    public DateTimeOffset CriadoEm { get; set; } = DateTimeOffset.UtcNow;

    public decimal EfeitoNoSaldo()
    {
        if (Status == StatusMovimentacao.Cancelada)
        {
            return 0;
        }

        return Tipo == TipoMovimentacao.Despesa ? -Valor : Valor;
    }
}
