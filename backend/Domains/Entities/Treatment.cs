using System.ComponentModel.DataAnnotations;

namespace backend.Domains.Entities
{
    public class Treatment
    {
        public int Id { get; set; }

        [MaxLength(100)]
        public string Title { get; set; } = "";

        [MaxLength(1000)]
        public string Description { get; set; } = "";

        [MaxLength(50)]
        public string Duration { get; set; } = "";

        [MaxLength(50)]
        public string Price { get; set; } = "";
    }
}
