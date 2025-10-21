using backend.Domains.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/dev")]
    public class TestController : ControllerBase
    {
        private readonly IEmailSender _mail;
        private readonly ITextMessageService _textMsg;
        private readonly ILogger<TestController> _log;

        public TestController(IEmailSender mail, ITextMessageService textMsg, ILogger<TestController> log)
        {
            _mail = mail;
            _textMsg = textMsg;
            _log = log;
        }

        [HttpPost("send-test-email")]
        [AllowAnonymous]
        public async Task<IActionResult> SendTestEmail([FromQuery] string to = "you@example.com")
        {
            await _mail.SendAsync(
                to,
                "Test fra RystDentist",
                "Hei! Dette er en lokal test-epost (Mailtrap Sandbox).",
                "<p>Hei! Dette er en <strong>lokal test-epost</strong> (Mailtrap Sandbox).</p>"
            );
            return Ok(new { ok = true, sentTo = to });
        }

        [HttpPost("send-test-sms")]
        [AllowAnonymous]
        public async Task<IActionResult> SendTextMessageTest([FromQuery] string to, [FromQuery] string? msg = null)
        {
            if (string.IsNullOrWhiteSpace(to))
                return BadRequest("Provide ?to=+47XXXXXXXX");

            var text = string.IsNullOrWhiteSpace(msg) ? "Hello from RystDentist (local test)." : msg!;
            await _textMsg.SendAsync(to, text);
            return Ok(new { ok = true, sentTo = to, message = text });
        }
    }
}