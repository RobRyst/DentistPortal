using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly TokenService _jwtTokenService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(TokenService jwtTokenService, ILogger<AuthController> logger)
        {
            _jwtTokenService = jwtTokenService;
            _logger = logger;
        }
    }
}