using backend.Domains.Entities;
using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<AppUser> _users;
    private readonly SignInManager<AppUser> _signIn;
    private readonly TokenService _tokens;

    public AuthController(UserManager<AppUser> users, SignInManager<AppUser> signIn, TokenService tokens)
    {
        _users = users;
        _signIn = signIn;
        _tokens = tokens;
    }

    [HttpPost("register")]
    [Microsoft.AspNetCore.Authorization.AllowAnonymous]
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
    [Microsoft.AspNetCore.Authorization.AllowAnonymous]
    public async Task<ActionResult<AuthTokenResponse>> Login([FromBody] LoginRequest dto)
    {
        var user = await _users.FindByEmailAsync(dto.Email);
        if (user is null || !await _users.CheckPasswordAsync(user, dto.Password))
            return Unauthorized();

        var roles = await _users.GetRolesAsync(user);
        var jwt = _tokens.Create(user.Id, user.Email, roles);
        return Ok(new AuthTokenResponse { Token = jwt });
    }
}
