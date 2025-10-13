using System.ComponentModel.DataAnnotations;

namespace backend.DTOs
{
    public class RegisterRequest
    {
        [Required, EmailAddress] public string Email { get; set; } = "";
        [Required, MinLength(6)] public string Password { get; set; } = "";
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
    }

    public class LoginRequest
    {
        [Required, EmailAddress] public string Email { get; set; } = "";
        [Required] public string Password { get; set; } = "";
    }

    public class LoginStartResponse { public string UserId { get; set; } = ""; }

    public class Verify2FARequest
    {
        [Required] public string UserId { get; set; } = "";
        [Required, StringLength(6, MinimumLength = 6)] public string Code { get; set; } = "";
    }

    public class AuthTokenResponse { public string Token { get; set; } = ""; }
}
