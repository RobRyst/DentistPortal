using backend.Domains.Entities;
using backend.Domains.Interfaces;
using backend.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public class TwoFactorAuthService(ApplicationDbContext dbContext, IEmailSender emailSender, ILogger<TwoFactorAuthService> logger)
    {
        private readonly ApplicationDbContext _dbContext = dbContext;
        private readonly IEmailSender _emailSender = emailSender;
        private readonly ILogger<TwoFactorAuthService> _logger = logger;

        public async Task<string> GenerateAndSendCodeAsync(string userId)
        {
            var code = new Random().Next(100000, 999999).ToString();

            var twoFactorCode = new TwoFactorCode
            {
                UserId = userId,
                Code = code,
                ExpiresTime = DateTime.UtcNow.AddMinutes(10),
                CreatedTime = DateTime.UtcNow
            };

            _dbContext.TwoFactorCodes.Add(twoFactorCode);
            await _dbContext.SaveChangesAsync();

            var user = await _dbContext.Users.FindAsync(userId);
            if (user != null)
            {
                var subject = "Your 2FA Code";
                var text = $"Your 2FA code is: {code}";
                await _emailSender.SendAsync(user.Email, subject, text);
            }

            return code;
        }

        public async Task<bool> VerifyCodeAsync(string userId, string code)
        {
            var twoFactorCode = await _dbContext.TwoFactorCodes
                .Where(contains => contains.UserId == userId)
                .OrderByDescending(contains => contains.CreatedTime)
                .FirstOrDefaultAsync();

            if (twoFactorCode == null || twoFactorCode.ExpiresTime < DateTime.UtcNow)
            {
                return false;
            }
            return twoFactorCode.Code == code;
        }
    }
}
