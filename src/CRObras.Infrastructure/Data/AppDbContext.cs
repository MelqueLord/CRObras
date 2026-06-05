using CRObras.Application.Abstractions;
using CRObras.Domain.Entities;
using CRObras.Infrastructure.Auth;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace CRObras.Infrastructure.Data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options)
    : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>(options), IAppDbContext
{
    public DbSet<Obra> Obras => Set<Obra>();
    public DbSet<Socio> Socios => Set<Socio>();
    public DbSet<Fornecedor> Fornecedores => Set<Fornecedor>();
    public DbSet<ObraSocio> ObraSocios => Set<ObraSocio>();
    public DbSet<MovimentacaoFinanceira> MovimentacoesFinanceiras => Set<MovimentacaoFinanceira>();
    public DbSet<Aporte> Aportes => Set<Aporte>();
    public DbSet<Despesa> Despesas => Set<Despesa>();
    public DbSet<Venda> Vendas => Set<Venda>();
    public DbSet<ParcelaReceber> ParcelasReceber => Set<ParcelaReceber>();
    public DbSet<AtivoPermuta> AtivosPermuta => Set<AtivoPermuta>();
    public DbSet<EncerramentoObra> EncerramentosObra => Set<EncerramentoObra>();
    public DbSet<DistribuicaoResultado> DistribuicoesResultado => Set<DistribuicaoResultado>();
    public DbSet<CRObras.Domain.Entities.Material> Materiais => Set<CRObras.Domain.Entities.Material>();
    public DbSet<CRObras.Domain.Entities.RecentObra> RecentObras => Set<CRObras.Domain.Entities.RecentObra>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<ApplicationUser>().ToTable("users");
        builder.Entity<IdentityRole<Guid>>().ToTable("roles");
        builder.Entity<IdentityUserRole<Guid>>().ToTable("user_roles");
        builder.Entity<IdentityUserClaim<Guid>>().ToTable("user_claims");
        builder.Entity<IdentityUserLogin<Guid>>().ToTable("user_logins");
        builder.Entity<IdentityRoleClaim<Guid>>().ToTable("role_claims");
        builder.Entity<IdentityUserToken<Guid>>().ToTable("user_tokens");

        builder.Entity<Obra>(entity =>
        {
            entity.ToTable("obras");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Nome).HasMaxLength(160).IsRequired();
            entity.Property(e => e.Descricao).HasMaxLength(1000);
            entity.Property(e => e.Endereco).HasMaxLength(500);
            entity.Property(e => e.SaldoAtual).HasPrecision(18, 2);
            entity.HasIndex(e => e.Status);
        });

        builder.Entity<Socio>(entity =>
        {
            entity.ToTable("socios");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Nome).HasMaxLength(160).IsRequired();
            entity.Property(e => e.Documento).HasMaxLength(32);
            entity.Property(e => e.Email).HasMaxLength(160);
            entity.Property(e => e.Telefone).HasMaxLength(40);
        });

        builder.Entity<Fornecedor>(entity =>
        {
            entity.ToTable("fornecedores");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Nome).HasMaxLength(160).IsRequired();
            entity.Property(e => e.Documento).HasMaxLength(32);
            entity.Property(e => e.Telefone).HasMaxLength(40);
            entity.HasIndex(e => e.Nome);
        });

        builder.Entity<ObraSocio>(entity =>
        {
            entity.ToTable("obra_socios");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.PercentualParticipacao).HasPrecision(5, 2);
            entity.Property(e => e.Observacao).HasMaxLength(500);
            entity.HasIndex(e => new { e.ObraId, e.SocioId }).IsUnique();
            entity.HasOne(e => e.Obra).WithMany(e => e.Socios).HasForeignKey(e => e.ObraId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Socio).WithMany(e => e.Obras).HasForeignKey(e => e.SocioId).OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<MovimentacaoFinanceira>(entity =>
        {
            entity.ToTable("movimentacoes_financeiras");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Categoria).HasMaxLength(80).IsRequired();
            entity.Property(e => e.Valor).HasPrecision(18, 2);
            entity.Property(e => e.Descricao).HasMaxLength(500).IsRequired();
            entity.HasIndex(e => new { e.ObraId, e.DataMovimentacao });
            entity.HasIndex(e => new { e.ObraId, e.Tipo });
            entity.Ignore(e => e.ParcelaReceber);
            entity.HasOne(e => e.Obra).WithMany(e => e.Movimentacoes).HasForeignKey(e => e.ObraId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Socio).WithMany().HasForeignKey(e => e.SocioId).OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<Aporte>(entity =>
        {
            entity.ToTable("aportes");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Valor).HasPrecision(18, 2);
            entity.HasOne(e => e.Obra).WithMany().HasForeignKey(e => e.ObraId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Socio).WithMany().HasForeignKey(e => e.SocioId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.MovimentacaoFinanceira).WithMany().HasForeignKey(e => e.MovimentacaoFinanceiraId).OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<Despesa>(entity =>
        {
            entity.ToTable("despesas");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Fornecedor).HasMaxLength(160);
            entity.Property(e => e.DocumentoFiscal).HasMaxLength(80);
            entity.HasOne(e => e.Obra).WithMany().HasForeignKey(e => e.ObraId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.MovimentacaoFinanceira).WithMany().HasForeignKey(e => e.MovimentacaoFinanceiraId).OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<Venda>(entity =>
        {
            entity.ToTable("vendas");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ValorTotalNegociado).HasPrecision(18, 2);
            entity.Property(e => e.ValorEntrada).HasPrecision(18, 2);
            entity.Property(e => e.CompradorNome).HasMaxLength(160).IsRequired();
            entity.Property(e => e.CompradorDocumento).HasMaxLength(32);
            entity.Property(e => e.Observacao).HasMaxLength(1000);
            entity.HasIndex(e => e.ObraId);
            entity.HasOne(e => e.Obra).WithOne(e => e.Venda).HasForeignKey<Venda>(e => e.ObraId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<ParcelaReceber>(entity =>
        {
            entity.ToTable("parcelas_receber");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Valor).HasPrecision(18, 2);
            entity.HasIndex(e => new { e.ObraId, e.Status, e.DataVencimento });
            entity.HasOne(e => e.Venda).WithMany(e => e.Parcelas).HasForeignKey(e => e.VendaId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Obra).WithMany().HasForeignKey(e => e.ObraId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.MovimentacaoFinanceira).WithOne(e => e.ParcelaReceber).HasForeignKey<ParcelaReceber>(e => e.MovimentacaoFinanceiraId).OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<AtivoPermuta>(entity =>
        {
            entity.ToTable("ativos_permuta");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Descricao).HasMaxLength(500).IsRequired();
            entity.Property(e => e.ValorEstimado).HasPrecision(18, 2);
            entity.Property(e => e.DocumentoReferencia).HasMaxLength(120);
            entity.HasIndex(e => new { e.ObraId, e.Status });
            entity.HasOne(e => e.Venda).WithMany(e => e.Permutas).HasForeignKey(e => e.VendaId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Obra).WithMany().HasForeignKey(e => e.ObraId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<EncerramentoObra>(entity =>
        {
            entity.ToTable("encerramentos_obra");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TotalInvestido).HasPrecision(18, 2);
            entity.Property(e => e.TotalGasto).HasPrecision(18, 2);
            entity.Property(e => e.TotalRecebido).HasPrecision(18, 2);
            entity.Property(e => e.ValorPermutasEstimado).HasPrecision(18, 2);
            entity.Property(e => e.ResultadoFinanceiro).HasPrecision(18, 2);
            entity.Property(e => e.Observacao).HasMaxLength(1000);
            entity.HasIndex(e => e.ObraId).IsUnique();
            entity.HasOne(e => e.Obra).WithOne(e => e.Encerramento).HasForeignKey<EncerramentoObra>(e => e.ObraId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<DistribuicaoResultado>(entity =>
        {
            entity.ToTable("distribuicoes_resultado");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.PercentualParticipacao).HasPrecision(5, 2);
            entity.Property(e => e.ValorInvestido).HasPrecision(18, 2);
            entity.Property(e => e.ValorResultado).HasPrecision(18, 2);
            entity.Property(e => e.ValorAReceberOuPagar).HasPrecision(18, 2);
            entity.HasOne(e => e.EncerramentoObra).WithMany(e => e.Distribuicoes).HasForeignKey(e => e.EncerramentoObraId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Socio).WithMany().HasForeignKey(e => e.SocioId).OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<CRObras.Domain.Entities.Material>(entity =>
        {
            entity.ToTable("materiais");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Nome).HasMaxLength(300).IsRequired();
            entity.Property(e => e.Quantidade).HasPrecision(18, 4);
            entity.Property(e => e.PrecoUnitario).HasPrecision(18, 2);
            entity.HasIndex(e => e.ObraId);
            entity.HasOne<Obra>().WithMany().HasForeignKey("ObraId").OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<CRObras.Domain.Entities.RecentObra>(entity =>
        {
            entity.ToTable("recent_obras");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired();
            entity.Property(e => e.ObraId).IsRequired();
            entity.Property(e => e.CriadoEm).IsRequired();
            entity.HasIndex(e => new { e.UserId, e.CriadoEm });
        });
    }
}
