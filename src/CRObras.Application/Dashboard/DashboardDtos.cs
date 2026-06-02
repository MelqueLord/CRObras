namespace CRObras.Application.Dashboard;

public record DashboardObraResumo(Guid ObraId, string Nome, string Status, decimal SaldoAtual, decimal TotalInvestido, decimal TotalGasto, decimal TotalRecebido);
public record DashboardResumoResponse(decimal SaldoTotal, decimal TotalInvestido, decimal TotalGasto, decimal TotalRecebido, int ObrasAtivas, int ObrasEncerradas, IReadOnlyCollection<DashboardObraResumo> Obras);
public record ParcelaPendenteResponse(Guid ParcelaId, Guid ObraId, string ObraNome, int Numero, decimal Valor, DateOnly DataVencimento, string Status);
