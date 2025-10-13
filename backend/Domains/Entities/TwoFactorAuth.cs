namespace backend.Domains.Entities
{
    public class TwoFactorCode
    {
        public int Id { get; set; }
        public string UserId { get; set; } = "";
        public string Code { get; set; } = "";
        public DateTime ExpiresTime { get; set; }
    }
}