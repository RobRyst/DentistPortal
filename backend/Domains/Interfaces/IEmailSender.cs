namespace backend.Domains.Interfaces
{
    public interface IEmailSender
    {
        Task SendAsync(string toEmail, string subject, string text, string? html = null);
    }

    public class MailTrapOptions
    {
        public string Host { get; set; } = "sandbox.smtp.mailtrap.io";
        public int Port { get; set; } = 2525;
        public string User { get; set; } = "";
        public string Password { get; set; } = "";
        public string FromEmail { get; set; } = "noreply@RystDentist.local";
        public string FromName  { get; set; } = "RystDentist";
    }
}
