namespace backend.Domains.Entities
{
    public class Event
    {
        public int Id { get; set; }
        public int DentistId { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
    }
}