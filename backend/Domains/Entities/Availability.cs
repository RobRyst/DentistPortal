namespace backend.Domains.Entities
{
    public class AvailabilitySlot
    {
        public int Id { get; set; }
        public int ProviderId { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
    }
}