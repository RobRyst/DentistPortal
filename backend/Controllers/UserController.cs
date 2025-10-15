using backend.Domains.Entities;
using backend.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly UserManager<AppUser> _users;

    public UsersController(UserManager<AppUser> users) => _users = users;

    [HttpGet("me")]
    public async Task<ActionResult<AppUserDto>> Me()
    {
        var id = User.FindFirst(c => c.Type.Contains("sub"))!.Value;
        var u = await _users.FindByIdAsync(id);
        if (u is null) return NotFound();

        var roles = await _users.GetRolesAsync(u);
        return new AppUserDto
        {
            Id = u.Id, Email = u.Email,
            FirstName = u.FirstName, LastName = u.LastName,
            PhoneNumber = u.PhoneNumber, Address = u.Address,
            Roles = roles.ToArray()
        };
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateMe([FromBody] UpdateAppUserRequest dto)
    {
        var id = User.FindFirst(c => c.Type.Contains("sub"))!.Value;
        var u = await _users.FindByIdAsync(id);
        if (u is null) return NotFound();

        u.FirstName = dto.FirstName ?? u.FirstName;
        u.LastName  = dto.LastName  ?? u.LastName;
        u.PhoneNumber = dto.PhoneNumber ?? u.PhoneNumber;
        u.Address   = dto.Address   ?? u.Address;

        var result = await _users.UpdateAsync(u);
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

        var u = await _users.FindByIdAsync(dto.UserId);
        if (u is null) return NotFound("User not found.");

        await _users.AddToRoleAsync(u, dto.Role);
        return Ok();
    }
}
