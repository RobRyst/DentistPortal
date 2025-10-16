using System.Security.Claims;
using backend.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Domains.Entities;
using backend.Mapper;
using backend.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using backend.Domains.Interfaces;

namespace backend.Controllers.Auth
{

    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AppointmentController(
        ApplicationDbContext db,
        IMailSender mail,
        UserManager<AppUser> users,
        ILogger<AppointmentController> log) : ControllerBase
    {
        private readonly ApplicationDbContext _db = db;
        private readonly IMailSender _mail = mail;
        private readonly UserManager<AppUser> _users = users;
        private readonly ILogger<AppointmentController> _log = log;

        [HttpGet("slots")]
        public async Task<IEnumerable<AvailabilitySlotDto>> GetSlots(
            [FromQuery] int providerId,
            [FromQuery] DateTime fromUtc,
            [FromQuery] DateTime toUtc)
            => (await _db.AvailabilitySlots
                .Where(slot => slot.ProviderId == providerId
                            && slot.StartTime >= fromUtc
                            && slot.EndTime <= toUtc)
                .OrderBy(slot => slot.StartTime)
                .ToListAsync())
               .Select(slot => slot.ToDto());

        [HttpPost("bookings")]
        public async Task<ActionResult<AppointmentDto>> Book([FromBody] BookAppointmentRequest dto)
        {
            bool clash = await _db.Appointments.AnyAsync(appointment =>
                appointment.ProviderId == dto.ProviderId &&
                appointment.Status != AppointmentStatus.Cancelled &&
                appointment.StartTime < dto.EndTime && dto.StartTime < appointment.EndTime);

            if (clash) return Conflict("Time allerede booket.");

            var userId = GetUserId();
            if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

            var appointment = new Appointment
            {
                UserId = userId,
                ProviderId = dto.ProviderId,
                StartTime = dto.StartTime,
                EndTime = dto.EndTime,
                Notes = dto.Notes
            };

            _db.Appointments.Add(appointment);
            await _db.SaveChangesAsync();

            _db.Notifications.Add(new Notification
            {
                UserId = appointment.UserId,
                Message = $"Du har fått tildelt time {appointment.StartTime:u}"
            });
            await _db.SaveChangesAsync();

            var user = await _users.FindByIdAsync(userId);
            if (!string.IsNullOrWhiteSpace(user?.Email))
            {
                var subject = "Timebestilling bekreftet";
                var text = $"Hei {user.FirstName ?? ""}! Din time er bekreftet: {appointment.StartTime:dddd dd.MM.yyyy HH:mm}.";
                try { await _mail.SendAsync(user.Email!, subject, text); }
                catch (Exception ex) { _log.LogWarning(ex, "Kunne ikke sende mail til: {Email}", user.Email); }
            }
            return Ok(appointment.ToDto());
        }

        [HttpGet("my-appointments")]
        public async Task<IEnumerable<AppointmentSummaryDto>> MyAppointments()
        {
            var userId = GetUserId();
            if (string.IsNullOrWhiteSpace(userId)) return Array.Empty<AppointmentSummaryDto>();

            return (await _db.Appointments
                .Where(appointment => appointment.UserId == userId)
                .OrderByDescending(appointment => appointment.StartTime)
                .ToListAsync())
                .Select(appointment => appointment.ToSummary());
        }

        [HttpPost("{id}/cancel")]
        [Authorize(Roles = "Admin,Provider")]
        public async Task<IActionResult> Cancel(int id)
        {
            var appointment = await _db.Appointments.FindAsync(id);
            if (appointment is null) return NotFound();

            appointment.Status = AppointmentStatus.Cancelled;
            await _db.SaveChangesAsync();

            _db.Notifications.Add(new Notification
            {
                UserId = appointment.UserId,
                Message = $"Timen {appointment.StartTime:u} er kansellert."
            });
            await _db.SaveChangesAsync();

            var user = await _users.FindByIdAsync(appointment.UserId);
            if (!string.IsNullOrWhiteSpace(user?.Email))
            {
                try { await _mail.SendAsync(user.Email!, "Time kansellert", $"Timen {appointment.StartTime:dd.MM.yyyy HH:mm} er kansellert."); }
                catch (Exception ex) { _log.LogWarning(ex, "Kunne ikke sende email til: {Email}", user.Email); }
            }

            return NoContent();
        }

        public class UpdateAppointmentRequest
        {
            public DateTime StartTime { get; set; }
            public DateTime EndTime { get; set; }
            public string? Notes { get; set; }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Provider")]
        public async Task<ActionResult<AppointmentDto>> Update(int id, [FromBody] UpdateAppointmentRequest dto)
        {
            var appointment = await _db.Appointments.FindAsync(id);
            if (appointment is null) return NotFound();

            appointment.StartTime = dto.StartTime;
            appointment.EndTime = dto.EndTime;
            appointment.Notes = dto.Notes ?? appointment.Notes;

            await _db.SaveChangesAsync();

            _db.Notifications.Add(new Notification
            {
                UserId = appointment.UserId,
                Message = $"Timen er oppdatert til {appointment.StartTime:u}."
            });
            await _db.SaveChangesAsync();

            var user = await _users.FindByIdAsync(appointment.UserId);
            if (!string.IsNullOrWhiteSpace(user?.Email))
            {
                try { await _mail.SendAsync(user.Email!, "Time oppdatert", $"Ny tid: {appointment.StartTime:dd.MM.yyyy HH:mm}."); }
                catch (Exception ex) { _log.LogWarning(ex, "Could not send update email to {Email}", user.Email); }
            }

            return Ok(appointment.ToDto());
        }

        private string GetUserId()
            => User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirst(c => c.Type.Contains("sub"))?.Value
            ?? "";
    }
}
