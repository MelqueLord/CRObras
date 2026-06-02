using Microsoft.AspNetCore.Identity;

namespace CRObras.Infrastructure.Auth;

public sealed class ApplicationUser : IdentityUser<Guid>
{
    public string Nome { get; set; } = string.Empty;
}
