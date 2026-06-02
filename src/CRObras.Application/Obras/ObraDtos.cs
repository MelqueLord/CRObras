using CRObras.Domain.Enums;

namespace CRObras.Application.Obras;

public record ObraRequest(string Nome, string? Descricao, string? Endereco, DateOnly DataInicio, DateOnly? DataPrevistaConclusao, ObraStatus Status);
public record ObraSocioRequest(Guid SocioId, decimal PercentualParticipacao, string? Observacao);
public record ObraResponse(Guid Id, string Nome, string? Descricao, string? Endereco, DateOnly DataInicio, DateOnly? DataPrevistaConclusao, ObraStatus Status, decimal SaldoAtual, DateTimeOffset? DataEncerramento);
public record ObraSocioResponse(Guid Id, Guid SocioId, string SocioNome, decimal PercentualParticipacao, string? Observacao);
public record ResumoFinanceiroResponse(decimal SaldoAtual, decimal TotalInvestido, decimal TotalGasto, decimal TotalRecebido, decimal ValorPermutasEstimado, decimal ResultadoEconomico);
