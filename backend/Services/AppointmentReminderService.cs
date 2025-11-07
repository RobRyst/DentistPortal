using backend.Domains.Entities;
using backend.Domains.Interfaces;
using backend.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public class AppointmentReminderService(
        IServiceProvider services,
        ILogger<AppointmentReminderService> log) : BackgroundService
    {
        private readonly IServiceProvider _services = services;
        private readonly ILogger<AppointmentReminderService> _log = log;

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
                        .Where(appointment =>
                            appointment.Status != AppointmentStatus.Cancelled &&
                            !appointment.Reminder24hSent &&
                            appointment.StartTime > nowUtc &&
                            appointment.StartTime <= next24h)
                        .ToListAsync(stoppingToken);

                    if (upcoming.Count > 0)
                    {
                        _log.LogInformation("Sending {Count} appointment reminders", upcoming.Count);
                    }

                    var osloTz = TimeZoneInfo.FindSystemTimeZoneById("Central European Standard Time");

                    foreach (var appointment in upcoming)
                    {
                        var user = await users.FindByIdAsync(appointment.UserId);
                        if (user is null)
                            continue;

                        var localStart = TimeZoneInfo.ConvertTimeFromUtc(appointment.StartTime, osloTz);

                        var subject = "Reminder about an appointment at RystDental";
                        var name = string.IsNullOrWhiteSpace(user.FirstName)
                            ? (user.Email ?? "")
                            : user.FirstName;

                        var text =
                            $"Hello {name}!\n\n" +
                            $"Reminder about an appointment at RystDental " +
                            $"Date: {localStart:dddd dd.MM.yyyy} at {localStart:HH:mm}.\n\n" +
                            "If you can't make it, pleace contact Rystdental as soon as possible";

                        if (!string.IsNullOrWhiteSpace(user.Email))
                        {
                            try
                            {
                                await mail.SendAsync(user.Email!, subject, text);
                            }
                            catch (Exception ex)
                            {
                                _log.LogWarning(ex, "Couldn't send to {Email}", user.Email);
                            }
                        }

                        db.Notifications.Add(new Notification
                        {
                            UserId = appointment.UserId,
                            Message = $"Reminder: Your appointment starts at {localStart:dddd dd.MM.yyyy HH:mm}."
                        });

                        appointment.Reminder24hSent = true;
                    }

                    await db.SaveChangesAsync(stoppingToken);
                }
                catch (TaskCanceledException)
                {
                }
                catch (Exception ex)
                {
                    _log.LogError(ex, "Error during sending reminder");
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
