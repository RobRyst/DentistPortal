using backend.Domains.Entities;
using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController(UserManager<AppUser> users, SignInManager<AppUser> signIn, TokenService tokens, TwoFactorAuthService twoFactorService) : ControllerBase
    {
        private readonly UserManager<AppUser> _users = users;
        private readonly SignInManager<AppUser> _signIn = signIn;
        private readonly TokenService _tokens = tokens;
        private readonly TwoFactorAuthService _twoFactorService = twoFactorService;

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<ActionResult<AuthTokenResponse>> Login([FromBody] LoginRequest dto)
        {
            var user = await _users.FindByEmailAsync(dto.Email);
            if (user is null || !await _users.CheckPasswordAsync(user, dto.Password))
                return Unauthorized();

            await _twoFactorService.GenerateAndSendCodeAsync(user.Id);

            return Ok(new { message = "2FA code sent to email. Please verify the code." });
        }

        [HttpPost("verify-2FA")]
        [AllowAnonymous]
        public async Task<ActionResult> Verify2FA([FromBody] Verify2FARequest dto)
        {
            var user = await _users.FindByIdAsync(dto.UserId);
            if (user == null)
                return NotFound("User not found.");

            bool isValid = await _twoFactorService.VerifyCodeAsync(dto.UserId, dto.Code);
            if (!isValid)
                return BadRequest("Invalid or expired code.");

            var roles = await _users.GetRolesAsync(user);
            var jwt = _tokens.Create(user.Id, user.Email, roles);

            return Ok(new AuthTokenResponse { Token = jwt });
        }
    }
}
