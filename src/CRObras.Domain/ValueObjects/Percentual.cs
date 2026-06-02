using CRObras.Domain.Exceptions;

namespace CRObras.Domain.ValueObjects;

public readonly record struct Percentual
{
    public decimal Value { get; }

    public Percentual(decimal value)
    {
        if (value < 0 || value > 100)
        {
            throw new DomainException("Percentual deve estar entre 0 e 100.");
        }

        Value = decimal.Round(value, 2, MidpointRounding.AwayFromZero);
    }

    public static implicit operator decimal(Percentual percentual) => percentual.Value;
    public static Percentual From(decimal value) => new(value);
}
