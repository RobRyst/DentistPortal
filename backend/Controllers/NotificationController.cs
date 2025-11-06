using System.Security.Claims;
using backend.DTOs;
using backend.Infrastructure.Data;
using backend.Mapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController(ApplicationDbContext db, ILogger<NotificationsController> log) : ControllerBase
{
    private readonly ApplicationDbContext _db = db;
    private readonly ILogger<NotificationsController> _log = log;

    private string GetUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? User.FindFirst(c => c.Type.Contains("sub"))?.Value
        ?? "";

    [HttpGet("unread-count")]
    public async Task<ActionResult<object>> GetUnreadCount()
    {
        var userId = GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();
        var count = await _db.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .CountAsync();

        return Ok(new { count });
    }

    [HttpGet]
    public async Task<ActionResult<NotificationListResponse>> Get(
        [FromQuery] int skip = 0,
        [FromQuery] int take = 20,
        [FromQuery] bool onlyUnread = false)
    {
        var userId = GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var query = _db.Notifications
            .Where(notification => notification.UserId == userId);

        if (onlyUnread) query = query.Where(notification => !notification.IsRead);

        var items = await query
            .OrderByDescending(notification => notification.CreatedTime)
            .Skip(skip).Take(Math.Clamp(take, 1, 100))
            .ToListAsync();

        return Ok(new NotificationListResponse
        {
            Count = items.Count,
            Items = items.Select(notification => notification.ToDto()).ToList()
        });
    }

    [HttpPost("{id:int}/read")]
    public async Task<IActionResult> MarkRead(int id)
    {
        var userId = GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var notification = await _db.Notifications.FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId);
        if (notification is null) return NotFound();

        if (!notification.IsRead)
        {
            notification.IsRead = true;
            await _db.SaveChangesAsync();
        }
        return NoContent();
    }

    [HttpPost("read-all")]
    public async Task<IActionResult> MarkAllRead()
    {
        var userId = GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var toUpdate = await _db.Notifications.Where(notification => notification.UserId == userId && !notification.IsRead).ToListAsync();
        if (toUpdate.Count > 0)
        {
            foreach (var n in toUpdate) n.IsRead = true;
            await _db.SaveChangesAsync();
        }
        return NoContent();
    }
}
