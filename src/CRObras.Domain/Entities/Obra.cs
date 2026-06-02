using CRObras.Domain.Enums;
using CRObras.Domain.Exceptions;

namespace CRObras.Domain.Entities;

public class Obra
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Nome { get; set; } = string.Empty;
    public string? Descricao { get; set; }
    public string? Endereco { get; set; }
    public DateOnly DataInicio { get; set; }
    public DateOnly? DataPrevistaConclusao { get; set; }
    public ObraStatus Status { get; set; } = ObraStatus.Planejada;
    public decimal SaldoAtual { get; set; }
    public DateTimeOffset? DataEncerramento { get; set; }

    public ICollection<ObraSocio> Socios { get; set; } = [];
    public ICollection<MovimentacaoFinanceira> Movimentacoes { get; set; } = [];
    public Venda? Venda { get; set; }
    public EncerramentoObra? Encerramento { get; set; }

    public bool EstaEncerrada => Status == ObraStatus.Encerrada;

    public void GarantirAberta()
    {
        if (EstaEncerrada)
        {
            throw new DomainException("Obra encerrada nao permite alteracoes financeiras.");
        }
    }
}
