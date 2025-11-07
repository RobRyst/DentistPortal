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

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AppointmentController(
        ApplicationDbContext db,
        IEmailSender mail,
        UserManager<AppUser> users,
        ILogger<AppointmentController> log) : ControllerBase
    {
        private readonly ApplicationDbContext _db = db;
        private readonly IEmailSender _mail = mail;
        private readonly UserManager<AppUser> _users = users;
        private readonly ILogger<AppointmentController> _log = log;

        [HttpGet("available-slots")]
        public async Task<IEnumerable<AvailabilitySlotDto>> GetSlots(
            [FromQuery] int providerId,
            [FromQuery] DateTime fromUtc,
            [FromQuery] DateTime toUtc,
            [FromQuery] int? durationMinutes = null,
            [FromQuery] int? stepMinutes = null
        )
        {
            var nowUtc = DateTime.UtcNow;
            var effectiveFrom = fromUtc < nowUtc ? nowUtc : fromUtc;
            if (effectiveFrom >= toUtc)
                return Array.Empty<AvailabilitySlotDto>();

            var availability = await _db.AvailabilitySlots
                .Where(slot => slot.ProviderId == providerId &&
                               slot.StartTime < toUtc &&
                               slot.EndTime > effectiveFrom)
                .OrderBy(slot => slot.StartTime)
                .ToListAsync();

            if (availability.Count == 0) return Array.Empty<AvailabilitySlotDto>();
            var appointments = await _db.Appointments
                .Where(appointment => appointment.ProviderId == providerId &&
                                      appointment.Status != AppointmentStatus.Cancelled &&
                                      appointment.StartTime < toUtc &&
                                      appointment.EndTime > effectiveFrom)
                .OrderBy(appointment => appointment.StartTime)
                .ToListAsync();

            static List<(DateTime start, DateTime end)> SubtractBusy(
                DateTime freeStart, DateTime freeEnd, IEnumerable<Appointment> unavailable)
            {
                var result = new List<(DateTime start, DateTime end)> { (freeStart, freeEnd) };

                foreach (var busy in unavailable)
                {
                    var busystart = busy.StartTime;
                    var busyend = busy.EndTime;

                    for (int i = 0; i < result.Count; i++)
                    {
                        var (start, end) = result[i];
                        if (busyend <= start || busystart >= end) continue;

                        bool hasLeft = busystart > start;
                        bool hasRight = busyend < end;

                        result.RemoveAt(i);

                        if (hasLeft)
                            result.Insert(i++, (start, busystart));

                        if (hasRight)
                            result.Insert(i, (busyend, end));

                        break;
                    }
                }

                return result.Where(x => x.end > x.start).ToList();
            }

            var freeWindows = new List<(DateTime s, DateTime e)>();
            foreach (var available in availability)
            {
                var winStart = available.StartTime < effectiveFrom ? effectiveFrom : available.StartTime;
                var winEnd = available.EndTime > toUtc ? toUtc : available.EndTime;
                if (winEnd <= winStart) continue;

                var overlappingApptointments = appointments.Where(busy =>
                    busy.StartTime < winEnd && busy.EndTime > winStart);

                var pieces = SubtractBusy(winStart, winEnd, overlappingApptointments);
                freeWindows.AddRange(pieces);
            }

            var slots = new List<AvailabilitySlotDto>();
            int idSeq = 1;

            int duration = Math.Max(0, durationMinutes ?? 0);
            int step = Math.Max(1, stepMinutes ?? (duration > 0 ? duration : 1));

            foreach (var (start, end) in freeWindows.OrderBy(w => w.s))
            {
                if (duration <= 0)
                {
                    slots.Add(new AvailabilitySlotDto
                    {
                        Id = idSeq++,
                        ProviderId = providerId,
                        StartTime = start,
                        EndTime = end
                    });
                    continue;
                }

                var time = start;
                while (time.AddMinutes(duration) <= end)
                {
                    slots.Add(new AvailabilitySlotDto
                    {
                        Id = idSeq++,
                        ProviderId = providerId,
                        StartTime = time,
                        EndTime = time.AddMinutes(duration)
                    });
                    time = time.AddMinutes(step);
                }
            }

            return slots;
        }

        [HttpGet("all")]
        [Authorize(Roles = "Admin,Provider")]
        public async Task<IEnumerable<AppointmentDto>> GetAll(
        [FromQuery] DateTime? fromUtc,
        [FromQuery] DateTime? toUtc,
        [FromQuery] int? providerId)
        {
            var query = _db.Appointments.AsQueryable();

            if (fromUtc.HasValue)
            {
                query = query.Where(appointment => appointment.EndTime >= fromUtc.Value);
            }

            if (toUtc.HasValue)
            {
                query = query.Where(appointment => appointment.StartTime <= toUtc.Value);
            }

            if (providerId.HasValue)
            {
                query = query.Where(appointment => appointment.ProviderId == providerId.Value);
            }

            var items = await query
                .OrderBy(appointment => appointment.StartTime)
                .ToListAsync();

            return items.Select(appointment => appointment.ToDto());
        }

        [HttpPost("bookings")]
        public async Task<ActionResult<AppointmentDto>> Book([FromBody] BookAppointmentRequest dto)
        {
            if (dto.EndTime <= dto.StartTime)
                return BadRequest("Sluttid må være etter starttid.");

            var nowUtc = DateTime.UtcNow;
            if (dto.StartTime < nowUtc)
                return BadRequest("Du kan ikke booke en time i fortiden.");

            bool clash = await _db.Appointments.AnyAsync(appointment =>
                appointment.ProviderId == dto.ProviderId &&
                appointment.Status != AppointmentStatus.Cancelled &&
                appointment.StartTime < dto.EndTime &&
                dto.StartTime < appointment.EndTime);

            if (clash) return Conflict("Time allerede booket.");

            var userId = GetUserId();
            if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

            var user = await _users.FindByIdAsync(userId);
            var noteText = BuildAppointmentNotes(userId, user, dto.Notes);

            var appointment = new Appointment
            {
                UserId = userId,
                ProviderId = dto.ProviderId,
                StartTime = dto.StartTime,
                EndTime = dto.EndTime,
                Notes = noteText
            };

            _db.Appointments.Add(appointment);
            await _db.SaveChangesAsync();

            _db.Notifications.Add(new Notification
            {
                UserId = appointment.UserId,
                Message = $"Du har fått tildelt time {appointment.StartTime:u}"
            });
            await _db.SaveChangesAsync();

            if (!string.IsNullOrWhiteSpace(user?.Email))
            {
                var subject = "Timebestilling bekreftet";
                var greetingName = !string.IsNullOrWhiteSpace(user.FirstName)
                    ? user.FirstName
                    : user.Email;
                var text = $"Hei {greetingName}! Din time er bekreftet: {appointment.StartTime:dddd dd.MM.yyyy HH:mm}.";
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

            var nowUtc = DateTime.UtcNow;

            var appointments = await _db.Appointments
                .Where(appointment => appointment.UserId == userId)
                .OrderByDescending(appointment => appointment.StartTime)
                .ToListAsync();

            return appointments.Select(appointment =>
            {
                var status = appointment.Status;
                if (appointment.EndTime < nowUtc &&
                    (status == AppointmentStatus.Scheduled || status == AppointmentStatus.Confirmed))
                {
                    status = AppointmentStatus.Completed;
                }

                return new AppointmentSummaryDto
                {
                    Id = appointment.Id,
                    StartTime = appointment.StartTime,
                    EndTime = appointment.EndTime,
                    Status = status.ToString(),
                    Notes = appointment.Notes
                };
            });
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

        [HttpPost]
        [Route("")]
        [Authorize(Roles = "Admin,Provider")]
        public async Task<ActionResult<AppointmentDto>> AdminCreate([FromBody] CreateAppointmentRequest dto)
        {
            if (dto.EndTime <= dto.StartTime) return BadRequest("EndTime must be after StartTime.");

            bool clash = await _db.Appointments.AnyAsync(appointment =>
                appointment.ProviderId == dto.ProviderId &&
                appointment.Status != AppointmentStatus.Cancelled &&
                appointment.StartTime < dto.EndTime &&
                dto.StartTime < appointment.EndTime);

            if (clash) return Conflict("Time already booked.");

            var user = await _users.FindByIdAsync(dto.UserId);
            var noteText = BuildAppointmentNotes(dto.UserId, user, dto.Notes);

            var appointment = new Appointment
            {
                UserId = dto.UserId,
                ProviderId = dto.ProviderId,
                StartTime = dto.StartTime,
                EndTime = dto.EndTime,
                Notes = noteText
            };

            _db.Appointments.Add(appointment);
            await _db.SaveChangesAsync();

            _db.Notifications.Add(new Notification
            {
                UserId = appointment.UserId,
                Message = $"You've got an appointment at: {appointment.StartTime:u}"
            });
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(Update), new { id = appointment.Id }, appointment.ToDto());
        }

        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Admin,Provider")]
        public async Task<IActionResult> Delete(int id)
        {
            var appointment = await _db.Appointments.FindAsync(id);
            if (appointment is null) return NotFound();

            _db.Appointments.Remove(appointment);
            await _db.SaveChangesAsync();
            return NoContent();
        }

        private string GetUserId()
            => User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirst(c => c.Type.Contains("sub"))?.Value
            ?? "";

        private static string BuildAppointmentNotes(string userId, AppUser? user, string? rawNotes)
        {
            string patientIdentifier;
            if (!string.IsNullOrWhiteSpace(user?.FirstName) || !string.IsNullOrWhiteSpace(user?.LastName))
            {
                patientIdentifier = $"{user?.FirstName} {user?.LastName}".Trim();
            }
            else if (!string.IsNullOrWhiteSpace(user?.Email))
            {
                patientIdentifier = user.Email!;
            }
            else
            {
                patientIdentifier = userId;
            }

            var treatmentPart = rawNotes?.Trim();

            if (!string.IsNullOrWhiteSpace(treatmentPart))
                return $"{patientIdentifier} – {treatmentPart}";

            return $"{patientIdentifier}";
        }
    }
}
