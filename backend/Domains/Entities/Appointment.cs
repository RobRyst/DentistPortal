using System.ComponentModel.DataAnnotations;

namespace backend.Domains.Entities
{
    public class Appointment
    {
        public int Id { get; set; }
        public string UserId { get; set; } = "";
        public int ProviderId { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public AppointmentStatus Status { get; set; } = AppointmentStatus.Scheduled;
        public string? Notes { get; set; }
        [Timestamp]
        public byte[]? RowVersion { get; set; }
        public DateTime CreatedTime { get; set; } = DateTime.UtcNow;
        public bool Reminder24hSent { get; set; } = false;
    }
    public class UpdateAppointmentRequest
    {
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string? Notes { get; set; }
    }
}