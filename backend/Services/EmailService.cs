using System.Net;
using backend.Domains.Interfaces;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;

namespace backend.Services
{
    public class EmailService(IOptions<MailTrapOptions> options, ILogger<EmailService> log) : IEmailSender
    {
        private readonly MailTrapOptions _options = options.Value;
        private readonly ILogger<EmailService> _log = log;

        public async Task SendAsync(string toEmail, string subject, string text, string? html = null)
        {
            var msg = new MimeMessage();
            msg.From.Add(new MailboxAddress(_options.FromName, _options.FromEmail));
            msg.To.Add(MailboxAddress.Parse(toEmail));
            msg.Subject = subject;

            var body = new BodyBuilder
            {
                TextBody = text,
                HtmlBody = html ?? $"<p>{WebUtility.HtmlEncode(text)}</p>"
            };
            msg.Body = body.ToMessageBody();

            using var smtp = new SmtpClient();
            await smtp.ConnectAsync(_options.Host, _options.Port, SecureSocketOptions.StartTls);
            await smtp.AuthenticateAsync(_options.User, _options.Password);
            await smtp.SendAsync(msg);
            await smtp.DisconnectAsync(true);
        }
    }
}
