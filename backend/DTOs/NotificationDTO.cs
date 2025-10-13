namespace backend.DTOs
{
    public class NotificationDto
    {
        public int Id { get; set; }
        public string Message { get; set; } = "";
        public bool IsRead { get; set; }
        public DateTime CreatedTime { get; set; }
    }

    public class NotificationListResponse
    {
        public int Count { get; set; }
        public IReadOnlyList<NotificationDto> Items { get; set; } = Array.Empty<NotificationDto>();
    }
}
