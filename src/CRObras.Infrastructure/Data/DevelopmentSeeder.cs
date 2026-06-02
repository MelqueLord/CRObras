using CRObras.Infrastructure.Auth;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CRObras.Infrastructure.Data;

public static class DevelopmentSeeder
{
    public static async Task SeedDevelopmentDataAsync(this IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

        var email = configuration["SeedAdmin:Email"] ?? "admin@crobras.local";
        var password = configuration["SeedAdmin:Password"] ?? "123456";
        var nome = configuration["SeedAdmin:Nome"] ?? "Admin";

        var existing = await userManager.FindByEmailAsync(email);
        if (existing is not null)
        {
            return;
        }

        var user = new ApplicationUser
        {
            Nome = nome,
            Email = email,
            UserName = email,
            EmailConfirmed = true
        };

        await userManager.CreateAsync(user, password);
    }
}
