using System.ComponentModel.DataAnnotations;

namespace backend.Domains.Entities
{
    public class TwoFactorCode
    {
        public int Id { get; set; }
        public string UserId { get; set; } = "";
        public string Code { get; set; } = "";
        public DateTime ExpiresTime { get; set; }
        public DateTime CreatedTime { get; set; } = DateTime.UtcNow;
    }


    public class Verify2FARequest
    {
        [Required]
        public string UserId { get; set; } = "";
        [Required, StringLength(6, MinimumLength = 6)]
        public string Code { get; set; } = "";
    }
}