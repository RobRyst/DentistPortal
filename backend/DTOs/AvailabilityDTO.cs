namespace backend.DTOs
{
    public class AvailabilitySlotDto
    {
        public int Id { get; set; }
        public int ProviderId { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
    }

    public class CreateAvailabilitySlotRequest
    {
        public int ProviderId { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
    }
}
