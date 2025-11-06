using backend.Domains.Entities;
using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(
    UserManager<AppUser> users,
    SignInManager<AppUser> signIn,
    TokenService tokens,
    TwoFactorAuthService twoFactorAuth
) : ControllerBase
{
    private readonly UserManager<AppUser> _users = users;
    private readonly SignInManager<AppUser> _signIn = signIn;
    private readonly TokenService _tokens = tokens;
     private readonly TwoFactorAuthService _twoFactorAuth = twoFactorAuth;

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterRequest dto)
    {
        var user = new AppUser
        {
            Email = dto.Email,
            UserName = dto.Email,
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            PhoneNumber = dto.PhoneNumber
        };

        var result = await _users.CreateAsync(user, dto.Password);
        if (!result.Succeeded) return BadRequest(result.Errors);

        await _users.AddToRoleAsync(user, "Patient");
        return Ok();
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthTokenResponse>> Login([FromBody] LoginRequest dto)
    {
        var user = await _users.FindByEmailAsync(dto.Email);
        if (user is null || !await _users.CheckPasswordAsync(user, dto.Password))
            return Unauthorized();

        var roles = await _users.GetRolesAsync(user);
        var jwt = _tokens.Create(user.Id, user.Email, roles);
        return Ok(new AuthTokenResponse { Token = jwt });
    }
    public class LoginStartRequest { public string Email { get; set; } = ""; public string Password { get; set; } = ""; }
    public class LoginStartResponse { public bool TwoFactorRequired { get; set; } = true; public string UserId { get; set; } = ""; public string MaskedEmail { get; set; } = ""; }

    [HttpPost("login/start")]
    [AllowAnonymous]
    public async Task<ActionResult<LoginStartResponse>> LoginStart([FromBody] LoginStartRequest dto)
    {
        var user = await _users.FindByEmailAsync(dto.Email);
        if (user is null || !await _users.CheckPasswordAsync(user, dto.Password))
            return Unauthorized();
        await _twoFactorAuth.GenerateAndSendCodeAsync(user.Id);

        string mask(string? e)
        {
            if (string.IsNullOrWhiteSpace(e) || !e.Contains('@')) return "****";
            var parts = e.Split('@');
            string mask1 = parts[0].Length <= 1 ? "*" : parts[0][0] + new string('*', Math.Max(1, parts[0].Length - 1));
            string domain = parts[1];
            string mask2 = domain.Length <= 1 ? "*" : domain[0] + new string('*', Math.Max(1, domain.Length - 1));
            return $"{mask1}@{mask2}";
        }

        return Ok(new LoginStartResponse
        {
            TwoFactorRequired = true,
            UserId = user.Id,
            MaskedEmail = mask(user.Email)
        });
    }
    

    [HttpPost("2fa/verify")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthTokenResponse>> Verify2FA([FromBody] Verify2FARequest dto)
    {
        var ok = await _twoFactorAuth.VerifyCodeAsync(dto.UserId, dto.Code);
        if (!ok) return Unauthorized("Invalid or expired code.");

        var user = await _users.FindByIdAsync(dto.UserId);
        if (user is null) return Unauthorized();

        var roles = await _users.GetRolesAsync(user);
        var jwt = _tokens.Create(user.Id, user.Email, roles);
        return Ok(new AuthTokenResponse { Token = jwt });
    }
}

