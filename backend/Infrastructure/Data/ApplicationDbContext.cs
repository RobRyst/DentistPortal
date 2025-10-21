using backend.Domains.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;

namespace backend.Infrastructure.Data
{
    public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : IdentityDbContext<AppUser>(options)
    {
        public DbSet<Appointment> Appointments => Set<Appointment>();
        public DbSet<AvailabilitySlot> AvailabilitySlots => Set<AvailabilitySlot>();
        public DbSet<Notification> Notifications => Set<Notification>();
        public DbSet<IssueItem> Faq => Set<IssueItem>();
        public DbSet<TwoFactorCode> TwoFactorCodes => Set<TwoFactorCode>();
        public DbSet<Treatment> Treatments => Set<Treatment>();

        protected override void OnModelCreating(ModelBuilder b)
        {
            base.OnModelCreating(b);

            b.Entity<Appointment>().Property(appointment => appointment.RowVersion).IsRowVersion();
            b.Entity<Appointment>().HasIndex(appointment => new { appointment.UserId, appointment.StartTime });
            b.Entity<Appointment>().HasIndex(appointment => new { appointment.ProviderId, appointment.StartTime });
            b.Entity<AvailabilitySlot>().HasIndex(slot => new { slot.ProviderId, slot.StartTime });
            b.Entity<Notification>().HasIndex(notification => new { notification.UserId, notification.IsRead, notification.CreatedTime });
        }
    }
}
