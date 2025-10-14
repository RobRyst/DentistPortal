using backend.DTOs;
using backend.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Domains.Entities;
using backend.Mapper;


[ApiController, Route("api/[controller]"), Authorize]
public class AppointmentsController(ApplicationDbContext db) : ControllerBase
{
    [HttpGet("slots")]
    public async Task<IEnumerable<AvailabilitySlotDto>> GetSlots(int providerId, DateTime fromUtc, DateTime toUtc)
        => (await db.AvailabilitySlots
            .Where(slot => slot.ProviderId == providerId && slot.StartTime >= fromUtc && slot.EndTime <= toUtc)
            .OrderBy(slot => slot.StartTime)
            .ToListAsync())
           .Select(slot => slot.ToDto());

    [HttpPost("book")]
    public async Task<ActionResult<AppointmentDto>> Book([FromBody] BookAppointmentRequest dto)
    {
        bool clash = await db.Appointments.AnyAsync(appointment =>
            appointment.ProviderId == dto.ProviderId &&
            appointment.Status != AppointmentStatus.Cancelled &&
            appointment.StartTime < dto.EndTime && dto.StartTime < appointment.EndTime);

        if (clash) return Conflict("Time allerede booket.");

        var appt = new Appointment
        {
            UserId = User.FindFirst(c => c.Type.Contains("sub"))!.Value,
            ProviderId = dto.ProviderId,
            StartTime = dto.StartTime,
            EndTime = dto.EndTime,
            Notes = dto.Notes
        };

        db.Appointments.Add(appt);
        await db.SaveChangesAsync();

        db.Notifications.Add(new Notification
        {
            UserId = appt.UserId,
            Message = $"Du har fått tildelt time {appt.StartTime:u}"
        });
        await db.SaveChangesAsync();

        return Ok(appt.ToDto());
    }

    [HttpGet("mine")]
    public async Task<IEnumerable<AppointmentSummaryDto>> MyAppointments()
    {
        var uid = User.FindFirst(c => c.Type.Contains("sub"))!.Value;
        return (await db.Appointments.Where(a => a.UserId == uid)
            .OrderByDescending(a => a.StartTime).ToListAsync())
            .Select(a => a.ToSummary());
    }
}
