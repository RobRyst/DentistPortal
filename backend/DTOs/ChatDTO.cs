using System.ComponentModel.DataAnnotations;

namespace backend.DTOs
{
    public class ChatRequest { [Required] public string Message { get; set; } = ""; }
    public class ChatResponse { public string Answer { get; set; } = ""; }
}
