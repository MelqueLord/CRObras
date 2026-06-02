namespace CRObras.Application.Encerramento;

public record EncerrarObraRequest(string? Observacao);
public record DistribuicaoResponse(Guid SocioId, string SocioNome, decimal PercentualParticipacao, decimal ValorInvestido, decimal ValorResultado, decimal ValorAReceberOuPagar);
public record PreFechamentoResponse(decimal TotalInvestido, decimal TotalGasto, decimal TotalRecebido, decimal ValorPermutasEstimado, decimal ResultadoFinanceiro, decimal SaldoAtual, IReadOnlyCollection<string> Pendencias, IReadOnlyCollection<DistribuicaoResponse> Distribuicoes);
public record EncerramentoResponse(Guid Id, Guid ObraId, decimal TotalInvestido, decimal TotalGasto, decimal TotalRecebido, decimal ValorPermutasEstimado, decimal ResultadoFinanceiro, DateTimeOffset DataEncerramento, IReadOnlyCollection<DistribuicaoResponse> Distribuicoes);
