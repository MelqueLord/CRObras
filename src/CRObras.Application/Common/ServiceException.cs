namespace CRObras.Application.Common;

public sealed class ServiceException(string message) : Exception(message);
