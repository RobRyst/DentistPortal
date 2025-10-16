using backend.Domains.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/dev")]
public class TestController : ControllerBase
{
    private readonly IMailSender _mail;
    public TestController(IMailSender mail) => _mail = mail;

    [HttpPost("send-test-email")]
    [AllowAnonymous]
    public async Task<IActionResult> SendTest([FromQuery] string to = "Ryztad@live.com")
    {
        await _mail.SendAsync(
            to,
            "Test fra TannlegePortal",
            "Hei! Dette er en lokal test-epost (Mailtrap Sandbox).",
            "<p>Hei! Dette er en <strong>lokal test-epost</strong> (Mailtrap Sandbox).</p>"
        );
        return Ok(new { ok = true, sentTo = to });
    }
}