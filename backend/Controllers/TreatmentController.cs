using backend.Domains.Entities;
using backend.DTOs;
using backend.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TreatmentsController(ApplicationDbContext db) : ControllerBase
    {
        [HttpGet]
        [AllowAnonymous]
        public async Task<IEnumerable<TreatmentDto>> Get()
            => await db.Treatments
                .Select(treatment => new TreatmentDto
                {
                    Id = treatment.Id,
                    Title = treatment.Title,
                    Description = treatment.Description,
                    Duration = treatment.Duration,
                    Price = treatment.Price
                })
                .ToListAsync();

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] TreatmentDto dto)
        {
            db.Treatments.Add(new Treatment
            {
                Title = dto.Title,
                Description = dto.Description,
                Duration = dto.Duration,
                Price = dto.Price
            });
            await db.SaveChangesAsync();
            return Ok();
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] TreatmentDto dto)
        {
            var treatment = await db.Treatments.FindAsync(id);
            if (treatment is null) return NotFound();
            treatment.Title = dto.Title; treatment.Description = dto.Description;
            treatment.Duration = dto.Duration; treatment.Price = dto.Price;
            await db.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var treatment = await db.Treatments.FindAsync(id);
            if (treatment is null) return NotFound();
            db.Treatments.Remove(treatment);
            await db.SaveChangesAsync();
            return NoContent();
        }
    }
}