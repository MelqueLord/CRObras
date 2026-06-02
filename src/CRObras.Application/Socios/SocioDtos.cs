namespace CRObras.Application.Socios;

public record SocioRequest(string Nome, string? Documento, string? Email, string? Telefone, bool Ativo);
public record SocioResponse(Guid Id, string Nome, string? Documento, string? Email, string? Telefone, bool Ativo);
public record SocioRemovalResponse(Guid Id, string Acao, string Mensagem);
