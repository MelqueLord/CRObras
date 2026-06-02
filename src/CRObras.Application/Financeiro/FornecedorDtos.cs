namespace CRObras.Application.Financeiro;

public record FornecedorRequest(string Nome, string? Documento, string? Telefone, bool Ativo);
public record FornecedorResponse(Guid Id, string Nome, string? Documento, string? Telefone, bool Ativo);
