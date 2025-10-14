using backend.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Domains.Entities;
using backend.Mapper;
using backend.Infrastructure.Data;

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

    [HttpPost("bookings")]
    public async Task<ActionResult<AppointmentDto>> Book([FromBody] BookAppointmentRequest dto)
    {
        bool clash = await db.Appointments.AnyAsync(appointment =>
            appointment.ProviderId == dto.ProviderId &&
            appointment.Status != AppointmentStatus.Cancelled &&
            appointment.StartTime < dto.EndTime && dto.StartTime < appointment.EndTime);

        if (clash) return Conflict("Time allerede booket.");

        var appointment = new Appointment
        {
            UserId = User.FindFirst(c => c.Type.Contains("sub"))!.Value,
            ProviderId = dto.ProviderId,
            StartTime = dto.StartTime,
            EndTime = dto.EndTime,
            Notes = dto.Notes
        };

        db.Appointments.Add(appointment);
        await db.SaveChangesAsync();

        db.Notifications.Add(new Notification
        {
            UserId = appointment.UserId,
            Message = $"Du har fått tildelt time {appointment.StartTime:u}"
        });
        await db.SaveChangesAsync();

        return Ok(appointment.ToDto());
    }

    [HttpGet("my-appointments")]
    public async Task<IEnumerable<AppointmentSummaryDto>> MyAppointments()
    {
        var uid = User.FindFirst(c => c.Type.Contains("sub"))!.Value;
        return (await db.Appointments.Where(appointment => appointment.UserId == uid)
            .OrderByDescending(appointment => appointment.StartTime).ToListAsync())
            .Select(appointment => appointment.ToSummary());
    }
}
