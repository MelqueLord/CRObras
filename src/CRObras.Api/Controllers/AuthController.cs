using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using CRObras.Application.Common;
using CRObras.Infrastructure.Auth;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;

namespace CRObras.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(UserManager<ApplicationUser> userManager, IConfiguration configuration) : ControllerBase
{
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        var user = new ApplicationUser { UserName = request.Email, Email = request.Email, Nome = request.Nome };
        var result = await userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            throw new ServiceException(string.Join(" ", result.Errors.Select(e => e.Description)));
        }

        return await CreateTokenAsync(user);
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        var user = await userManager.FindByEmailAsync(request.Email)
            ?? throw new ServiceException("Credenciais invalidas.");
        if (!await userManager.CheckPasswordAsync(user, request.Password))
        {
            throw new ServiceException("Credenciais invalidas.");
        }

        return await CreateTokenAsync(user);
    }

    private async Task<AuthResponse> CreateTokenAsync(ApplicationUser user)
    {
        var roles = await userManager.GetRolesAsync(user);
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new(ClaimTypes.Name, user.Nome)
        };
        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var key = configuration["Jwt:Key"] ?? "CRObras-dev-secret-key-change-in-production";
        var credentials = new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)), SecurityAlgorithms.HmacSha256);
        var expiresAt = DateTime.UtcNow.AddHours(8);
        var token = new JwtSecurityToken(
            issuer: configuration["Jwt:Issuer"] ?? "CRObras",
            audience: configuration["Jwt:Audience"] ?? "CRObras.Web",
            claims: claims,
            expires: expiresAt,
            signingCredentials: credentials);

        return new AuthResponse(new JwtSecurityTokenHandler().WriteToken(token), expiresAt, user.Nome, user.Email ?? string.Empty);
    }
}

public record RegisterRequest(string Nome, string Email, string Password);
public record LoginRequest(string Email, string Password);
public record AuthResponse(string Token, DateTime ExpiresAt, string Nome, string Email);
