using CRObras.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CRObras.Application.Abstractions;

public interface IAppDbContext
{
    DbSet<Obra> Obras { get; }
    DbSet<Socio> Socios { get; }
    DbSet<Fornecedor> Fornecedores { get; }
    DbSet<ObraSocio> ObraSocios { get; }
    DbSet<MovimentacaoFinanceira> MovimentacoesFinanceiras { get; }
    DbSet<Aporte> Aportes { get; }
    DbSet<Despesa> Despesas { get; }
    DbSet<Venda> Vendas { get; }
    DbSet<ParcelaReceber> ParcelasReceber { get; }
    DbSet<AtivoPermuta> AtivosPermuta { get; }
    DbSet<EncerramentoObra> EncerramentosObra { get; }
    DbSet<DistribuicaoResultado> DistribuicoesResultado { get; }
    DbSet<CRObras.Domain.Entities.Material> Materiais { get; }
    DbSet<CRObras.Domain.Entities.RecentObra> RecentObras { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
