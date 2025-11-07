using System.ComponentModel.DataAnnotations;

namespace backend.DTOs
{
    public class AppointmentDto
    {
        public int Id { get; set; }
        public int ProviderId { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string Status { get; set; } = "Scheduled";
        public string? Notes { get; set; }
    }

    public class AppointmentSummaryDto
    {
        public int Id { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string Status { get; set; } = "Scheduled";
        public string? Notes { get; set; } 
    }

    public class BookAppointmentRequest
    {
        [Required]
        public int ProviderId { get; set; }
        [Required]
        public DateTime StartTime { get; set; }
        [Required]
        public DateTime EndTime { get; set; }
        public string? Notes { get; set; }
    }

    public class CreateAppointmentRequest
    {
        [Required]
        public string UserId { get; set; } = "";
        [Required]
        public int ProviderId { get; set; }
        [Required]
        public DateTime StartTime { get; set; }
        [Required]
        public DateTime EndTime { get; set; }
        public string? Notes { get; set; }
    }
}
