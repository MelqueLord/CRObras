namespace CRObras.Domain.Enums;

public enum ObraStatus
{
    Planejada = 1,
    EmAndamento = 2,
    Vendida = 3,
    Encerrada = 4,
    Cancelada = 5
}

public enum TipoMovimentacao
{
    Aporte = 1,
    Despesa = 2,
    RecebimentoVenda = 3,
    Ajuste = 4
}

public enum StatusMovimentacao
{
    Confirmada = 1,
    Cancelada = 2
}

public enum CategoriaDespesa
{
    Material = 1,
    MaoDeObra = 2,
    Pintura = 3,
    Eletricista = 4,
    Cartorio = 5,
    Impostos = 6,
    Terreno = 7,
    Outros = 99
}

public enum TipoVenda
{
    Dinheiro = 1,
    Parcelada = 2,
    Permuta = 3,
    Mista = 4
}

public enum StatusVenda
{
    Aberta = 1,
    Quitada = 2,
    Cancelada = 3
}

public enum StatusParcela
{
    Pendente = 1,
    Paga = 2,
    Vencida = 3,
    Cancelada = 4
}

public enum TipoAtivoPermuta
{
    Terreno = 1,
    Imovel = 2,
    Veiculo = 3,
    Outro = 99
}

public enum StatusAtivoPermuta
{
    Recebido = 1,
    Pendente = 2,
    Vendido = 3
}
