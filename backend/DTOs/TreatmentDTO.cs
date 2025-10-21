namespace backend.DTOs
{
    public class TreatmentDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = "";
        public string Description { get; set; } = "";
        public string Duration { get; set; } = "";
        public string Price { get; set; } = "";
    }
}