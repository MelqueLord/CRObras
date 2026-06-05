namespace CRObras.Application.Obras;

public record MaterialRequest(string Nome, decimal Quantidade, decimal PrecoUnitario);
public record MaterialResponse(Guid Id, Guid ObraId, string Nome, decimal Quantidade, decimal PrecoUnitario);
