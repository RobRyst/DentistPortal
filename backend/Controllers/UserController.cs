using System.Security.Claims;
using backend.Domains.Entities;
using backend.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserController(UserManager<AppUser> users) : ControllerBase
    {
        private readonly UserManager<AppUser> _users = users;

        [HttpGet("me")]
        public async Task<ActionResult<AppUserDto>> Me()
        {
            var id = GetUserId();
            if (string.IsNullOrWhiteSpace(id))
                return Unauthorized();

            var user = await _users.FindByIdAsync(id);
            if (user is null) return NotFound();

            var roles = await _users.GetRolesAsync(user);
            return new AppUserDto
            {
                Id = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                PhoneNumber = user.PhoneNumber,
                Address = user.Address,
                Roles = [.. roles]
            };
        }

        [HttpPut("me")]
        public async Task<IActionResult> UpdateMe([FromBody] UpdateAppUserRequest dto)
        {
            var id = GetUserId();
            if (string.IsNullOrWhiteSpace(id))
                return Unauthorized();

            var user = await _users.FindByIdAsync(id);
            if (user is null) return NotFound();

            user.FirstName = dto.FirstName ?? user.FirstName;
            user.LastName = dto.LastName ?? user.LastName;
            user.PhoneNumber = dto.PhoneNumber ?? user.PhoneNumber;
            user.Address = dto.Address ?? user.Address;

            var result = await _users.UpdateAsync(user);
            if (!result.Succeeded) return BadRequest(result.Errors);
            return NoContent();
        }

        [HttpPost("assign-role")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AssignRole([FromBody] AssignRoleRequest dto)
        {
            var allowed = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "Provider", "Patient" };
            if (!allowed.Contains(dto.Role))
                return BadRequest("You can only assign roles: Provider or Patient.");

            var user = await _users.FindByIdAsync(dto.UserId);
            if (user is null) return NotFound("User not found.");

            await _users.AddToRoleAsync(user, dto.Role);
            return Ok();
        }

        private string GetUserId()
            => User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirst(c => c.Type.Contains("sub"))?.Value
            ?? "";
    }
}
