namespace backend.Domains.Interfaces
{
    public interface ITokenService
    {
        string Create(string userId, string? email, IEnumerable<string>? roles = null);
    }
}
