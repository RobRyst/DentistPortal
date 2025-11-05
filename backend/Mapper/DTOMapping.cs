using backend.Domains.Entities;
using backend.DTOs;

namespace backend.Mapper
{
    public static class DtoMapping
    {
        public static AvailabilitySlotDto ToDto(this AvailabilitySlot slot) => new()
        {
            Id = slot.Id,
            ProviderId = slot.ProviderId,
            StartTime = slot.StartTime,
            EndTime = slot.EndTime
        };

        public static AvailabilitySlot ToEntity(this CreateAvailabilitySlotRequest slotDto) => new()
        {
            ProviderId = slotDto.ProviderId,
            StartTime = slotDto.StartTime,
            EndTime = slotDto.EndTime
        };

        public static AppointmentDto ToDto(this Appointment appointment) => new()
        {
            Id = appointment.Id,
            ProviderId = appointment.ProviderId,
            StartTime = appointment.StartTime,
            EndTime = appointment.EndTime,
            Status = appointment.Status.ToString(),
            Notes = appointment.Notes
        };

        public static AppointmentSummaryDto ToSummary(this Appointment appointment) => new()
        {
            Id = appointment.Id,
            StartTime = appointment.StartTime,
            EndTime = appointment.EndTime,
            Status = appointment.Status.ToString(),
            Notes = appointment.Notes
        };

        public static NotificationDto ToDto(this Notification notification) => new()
        {
            Id = notification.Id,
            Message = notification.Message,
            IsRead = notification.IsRead,
            CreatedTime = notification.CreatedTime
        };

        public static IssueItemDto ToDto(this IssueItem issue) => new()
        {
            Id = issue.Id,
            Issue = issue.Issue,
            Answer = issue.Answer
        };

        public static IssueItem ToEntity(this CreateIssueItemRequest issueDto) => new()
        {
            Issue = issueDto.Issue,
            Answer = issueDto.Answer
        };

        public static void Apply(this IssueItem entity, UpdateIssueItemRequest issueDto)
        {
            entity.Issue = issueDto.Issue;
            entity.Answer = issueDto.Answer;
        }
    }
}
