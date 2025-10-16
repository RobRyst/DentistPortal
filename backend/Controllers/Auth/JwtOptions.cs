namespace backend.Controllers.Auth
{
    public sealed class JwtOptions
    {
        public string Issuer { get; init; } = string.Empty;
        public string Key { get; init; } = string.Empty;
        public int ExpireMinutes { get; init; } = 60;
    }
}