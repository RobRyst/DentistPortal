namespace backend.Domains.Interfaces
{
    public interface ITextMessageService
    {
        Task SendAsync(string toE164, string text);
    }
    public sealed class TwilioOptions
    {
        public string AccountSid { get; set; } = "";
        public string AuthToken  { get; set; } = "";
        public string FromNumber { get; set; } = "";
    }
}
