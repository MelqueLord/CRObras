namespace CRObras.Application.Common;

public static class DateOnlyExtensions
{
    public static DateOnly Today() => DateOnly.FromDateTime(DateTime.UtcNow.Date);
}
