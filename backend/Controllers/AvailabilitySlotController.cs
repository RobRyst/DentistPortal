using backend.DTOs;
using backend.Infrastructure.Data;
using backend.Mapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/availability-slots")]
    [Authorize(Roles = "Admin,Provider")]
    public class AvailabilitySlotsController(ApplicationDbContext db) : ControllerBase
    {
        private readonly ApplicationDbContext _db = db;

        [HttpGet]
        public async Task<IEnumerable<AvailabilitySlotDto>> Get(
            [FromQuery] int providerId,
            [FromQuery] DateTime fromUtc,
            [FromQuery] DateTime toUtc)
        {
            var items = await _db.AvailabilitySlots
                .Where(slot => slot.ProviderId == providerId &&
                            slot.StartTime >= fromUtc &&
                            slot.EndTime <= toUtc)
                .OrderBy(slot => slot.StartTime)
                .ToListAsync();

            return items.Select(slot => slot.ToDto());
        }

        [HttpPost]
        public async Task<ActionResult<AvailabilitySlotDto>> Create([FromBody] CreateAvailabilitySlotRequest dto)
        {
            if (dto.EndTime <= dto.StartTime)
                return BadRequest("EndTime must be after StartTime.");

            bool overlap = await _db.AvailabilitySlots.AnyAsync(slot =>
                slot.ProviderId == dto.ProviderId &&
                slot.StartTime < dto.EndTime &&
                dto.StartTime < slot.EndTime
            );
            if (overlap) return Conflict("Availability slot exists.");

            var entity = dto.ToEntity();
            _db.AvailabilitySlots.Add(entity);
            await _db.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = entity.Id }, entity.ToDto());
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<AvailabilitySlotDto>> GetById(int id)
        {
            var slot = await _db.AvailabilitySlots.FindAsync(id);
            if (slot is null) return NotFound();
            return slot.ToDto();
        }

        public class UpdateAvailabilitySlotRequest
        {
            public int ProviderId { get; set; }
            public DateTime StartTime { get; set; }
            public DateTime EndTime { get; set; }
        }

        [HttpPut("{id:int}")]
        public async Task<ActionResult<AvailabilitySlotDto>> Update(int id, [FromBody] UpdateAvailabilitySlotRequest dto)
        {
            if (dto.EndTime <= dto.StartTime)
                return BadRequest("EndTime must be after StartTime.");

            var slot = await _db.AvailabilitySlots.FindAsync(id);
            if (slot is null) return NotFound();

            bool overlap = await _db.AvailabilitySlots.AnyAsync(slot =>
                slot.Id != id &&
                slot.ProviderId == dto.ProviderId &&
                slot.StartTime < dto.EndTime &&
                dto.StartTime < slot.EndTime
            );
            if (overlap) return Conflict("Availability slot exists.");

            slot.ProviderId = dto.ProviderId;
            slot.StartTime = dto.StartTime;
            slot.EndTime = dto.EndTime;

            await _db.SaveChangesAsync();
            return Ok(slot.ToDto());
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var slot = await _db.AvailabilitySlots.FindAsync(id);
            if (slot is null) return NotFound();

            _db.AvailabilitySlots.Remove(slot);
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}
