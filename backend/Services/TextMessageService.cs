using System.Net.Http.Headers;
using System.Text;
using backend.Domains.Interfaces;
using Microsoft.Extensions.Options;

namespace backend.Services
{
    public sealed class TextMessageService(HttpClient http, IOptions<TwilioOptions> options, ILogger<TextMessageService> log) : ITextMessageService
    {
        private readonly HttpClient _http = http;
        private readonly TwilioOptions _options = options.Value;
        private readonly ILogger<TextMessageService> _log = log;

        public async Task SendAsync(string toE164, string text)
        {
            if (string.IsNullOrWhiteSpace(_options.AccountSid) ||
                string.IsNullOrWhiteSpace(_options.AuthToken)  ||
                string.IsNullOrWhiteSpace(_options.FromNumber))
            {
                throw new InvalidOperationException("TwilioOptions are not configured.");
            }

            var creds = Convert.ToBase64String(Encoding.ASCII.GetBytes($"{_options.AccountSid}:{_options.AuthToken}"));
            _http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", creds);

            var form = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["To"]   = toE164,
                ["From"] = _options.FromNumber,
                ["Body"] = text
            });

            var url = $"https://api.twilio.com/2010-04-01/Accounts/{_options.AccountSid}/Messages.json";
            var resp = await _http.PostAsync(url, form);
            if (!resp.IsSuccessStatusCode)
            {
                var body = await resp.Content.ReadAsStringAsync();
                _log.LogError("Twilio SMS failed: {Status} {Body}", resp.StatusCode, body);
                throw new InvalidOperationException($"SMS send failed ({(int)resp.StatusCode}).");
            }
        }
    }

    public sealed class DevSmsSender(ILogger<DevSmsSender> log) : ITextMessageService
    {
        private readonly ILogger<DevSmsSender> _log = log;

        public Task SendAsync(string toE164, string text)
        {
            _log.LogInformation("[DEV SMS] to={To} text={Text}", toE164, text);
            return Task.CompletedTask;
        }
    }
}
