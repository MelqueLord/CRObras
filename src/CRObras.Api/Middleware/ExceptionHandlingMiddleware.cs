using CRObras.Application.Common;
using CRObras.Domain.Exceptions;
using Microsoft.AspNetCore.Mvc;

namespace CRObras.Api.Middleware;

public sealed class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex) when (ex is ServiceException or DomainException)
        {
            await WriteProblemAsync(context, StatusCodes.Status400BadRequest, ex.Message);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled API error");
            await WriteProblemAsync(context, StatusCodes.Status500InternalServerError, "Erro interno da aplicacao.");
        }
    }

    private static async Task WriteProblemAsync(HttpContext context, int status, string detail)
    {
        context.Response.StatusCode = status;
        await context.Response.WriteAsJsonAsync(new ProblemDetails
        {
            Status = status,
            Title = status == StatusCodes.Status400BadRequest ? "Regra de negocio violada" : "Erro",
            Detail = detail
        });
    }
}
