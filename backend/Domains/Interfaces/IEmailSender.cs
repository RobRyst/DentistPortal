namespace backend.Domains.Interfaces
{
    public interface IMailSender
    {
        Task SendAsync(string toEmail, string subject, string text, string? html = null);
    }

    public class MailtrapOptions
    {
        public string ApiToken { get; set; } = "";
        public string FromEmail { get; set; } = "noreply@RystDental.local";
        public string FromName { get; set; } = "RystTannlegePortal";
    }
}
