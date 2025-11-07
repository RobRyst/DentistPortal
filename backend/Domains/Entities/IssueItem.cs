using System.ComponentModel.DataAnnotations;

namespace backend.Domains.Entities
{
    public class IssueItem
    {
        public int Id { get; set; }
        [MaxLength(200)]
        public string Issue { get; set; } = "";
        [MaxLength(1000)]
        public string Answer   { get; set; } = "";
    }
}