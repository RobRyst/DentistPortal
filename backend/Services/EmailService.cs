using System.Text;
using System.Text.Json;
using backend.Domains.Interfaces;
using Microsoft.Extensions.Options;

namespace backend.Services.Email
{
    public class EmailService(HttpClient http, IOptions<MailtrapOptions> opt, ILogger<EmailService> logger) : IMailSender
    {
        private readonly HttpClient _http = http;
        private readonly MailtrapOptions _options = opt.Value;
        private readonly ILogger<EmailService> _logger = logger;

        public async Task SendAsync(string toEmail, string subject, string text, string? html = null)
        {
            using var req = new HttpRequestMessage(HttpMethod.Post, "/api/send");
            req.Headers.Add("Api-Token", _options.ApiToken);

            var payload = new
            {
                from = new { email = _options.FromEmail, name = _options.FromName },
                to = new[] { new { email = toEmail } },
                subject,
                text,
                html = html ?? $"<p>{System.Net.WebUtility.HtmlEncode(text)}</p>"
            };

            req.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            var resp = await _http.SendAsync(req);

            if (!resp.IsSuccessStatusCode)
            {
                var body = await resp.Content.ReadAsStringAsync();
                _logger.LogError("Mailtrap send failed: {Status} {Body}", resp.StatusCode, body);
                throw new InvalidOperationException($"Mail send failed ({(int)resp.StatusCode}).");
            }
        }
    }
}
