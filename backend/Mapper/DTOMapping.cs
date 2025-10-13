using backend.Domains.Entities;
using backend.DTOs;

namespace backend.Mapper
{
    public static class DtoMapping
    {
        public static AvailabilitySlotDto ToDto(this AvailabilitySlot s) => new()
        {
            Id = s.Id,
            ProviderId = s.ProviderId,
            StartTime = s.StartTime,
            EndTime = s.EndTime
        };

        public static AvailabilitySlot ToEntity(this CreateAvailabilitySlotRequest dto) => new()
        {
            ProviderId = dto.ProviderId,
            StartTime = dto.StartTime,
            EndTime = dto.EndTime
        };

        public static AppointmentDto ToDto(this Appointment a) => new()
        {
            Id = a.Id,
            ProviderId = a.ProviderId,
            StartTime = a.StartTime,
            EndTime = a.EndTime,
            Status = a.Status.ToString(),
            Notes = a.Notes
        };

        public static AppointmentSummaryDto ToSummary(this Appointment a) => new()
        {
            Id = a.Id,
            StartTime = a.StartTime,
            EndTime = a.EndTime,
            Status = a.Status.ToString()
        };

        public static NotificationDto ToDto(this Notification n) => new()
        {
            Id = n.Id,
            Message = n.Message,
            IsRead = n.IsRead,
            CreatedTime = n.CreatedTime
        };

        public static IssueItemDto ToDto(this IssueItem f) => new()
        {
            Id = f.Id,
            Issue = f.Issue,
            Answer = f.Answer
        };

        public static IssueItem ToEntity(this CreateIssueItemRequest dto) => new()
        {
            Issue = dto.Issue,
            Answer = dto.Answer
        };

        public static void Apply(this IssueItem entity, UpdateIssueItemRequest dto)
        {
            entity.Issue = dto.Issue;
            entity.Answer = dto.Answer;
        }
    }
}
