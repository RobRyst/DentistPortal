using System.ComponentModel.DataAnnotations;

namespace backend.DTOs
{
    public class IssueItemDto
    {
        public int Id { get; set; }
        public string Issue { get; set; } = "";
        public string Answer { get; set; } = "";
    }

    public class CreateIssueItemRequest
    {
        [Required, StringLength(200)]
        public string Issue { get; set; } = "";
        [Required, StringLength(1000)]
        public string Answer { get; set; } = "";
    }

    public class UpdateIssueItemRequest : CreateIssueItemRequest
    {
        [Required]
        public int Id { get; set; }
    }
}
