using backend.Domains.Entities;
using backend.Domains.Interfaces;
using backend.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public class AppointmentReminderService : BackgroundService
    {
        private readonly IServiceProvider _services;
        private readonly ILogger<AppointmentReminderService> _log;

        public AppointmentReminderService(
            IServiceProvider services,
            ILogger<AppointmentReminderService> log)
        {
            _services = services;
            _log = log;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _services.CreateScope();
                    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                    var users = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
                    var mail = scope.ServiceProvider.GetRequiredService<IEmailSender>();

                    var nowUtc = DateTime.UtcNow;
                    var next24h = nowUtc.AddHours(24);

                    var upcoming = await db.Appointments
                        .Where(a =>
                            a.Status != AppointmentStatus.Cancelled &&
                            !a.Reminder24hSent &&
                            a.StartTime > nowUtc &&
                            a.StartTime <= next24h)
                        .ToListAsync(stoppingToken);

                    if (upcoming.Count > 0)
                    {
                        _log.LogInformation("Sending {Count} appointment reminders", upcoming.Count);
                    }

                    var osloTz = TimeZoneInfo.FindSystemTimeZoneById("Central European Standard Time");

                    foreach (var appt in upcoming)
                    {
                        var user = await users.FindByIdAsync(appt.UserId);
                        if (user is null)
                            continue;

                        var localStart = TimeZoneInfo.ConvertTimeFromUtc(appt.StartTime, osloTz);

                        var subject = "Påminnelse om time hos RystDentist";
                        var name = string.IsNullOrWhiteSpace(user.FirstName)
                            ? (user.Email ?? "")
                            : user.FirstName;

                        var text =
                            $"Hei {name}!\n\n" +
                            $"Dette er en påminnelse om at du har time hos RystDentist " +
                            $"den {localStart:dddd dd.MM.yyyy} kl. {localStart:HH:mm}.\n\n" +
                            "Hvis du ikke kan møte opp, vennligst ta kontakt med oss så snart som mulig.";

                        if (!string.IsNullOrWhiteSpace(user.Email))
                        {
                            try
                            {
                                await mail.SendAsync(user.Email!, subject, text);
                            }
                            catch (Exception ex)
                            {
                                _log.LogWarning(ex, "Kunne ikke sende påminnelse til {Email}", user.Email);
                            }
                        }

                        db.Notifications.Add(new Notification
                        {
                            UserId = appt.UserId,
                            Message = $"Påminnelse: Du har time i morgen {localStart:dddd dd.MM.yyyy HH:mm}."
                        });

                        appt.Reminder24hSent = true;
                    }

                    await db.SaveChangesAsync(stoppingToken);
                }
                catch (TaskCanceledException)
                {
                }
                catch (Exception ex)
                {
                    _log.LogError(ex, "Feil under sending av timepåminnelser");
                }

                try
                {
                    await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
                }
                catch (TaskCanceledException)
                {
                }
            }
        }
    }
}
