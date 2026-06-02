using CRObras.Domain.Exceptions;

namespace CRObras.Domain.ValueObjects;

public readonly record struct Money
{
    public decimal Value { get; }

    public Money(decimal value)
    {
        if (value < 0)
        {
            throw new DomainException("Valor monetario nao pode ser negativo.");
        }

        Value = decimal.Round(value, 2, MidpointRounding.AwayFromZero);
    }

    public static implicit operator decimal(Money money) => money.Value;
    public static Money From(decimal value) => new(value);
}
