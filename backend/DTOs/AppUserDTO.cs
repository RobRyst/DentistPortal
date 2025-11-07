using System.ComponentModel.DataAnnotations;

namespace backend.DTOs
{
    public class AppUserDto
    {
        public string Id { get; set; } = "";
        public string? Email { get; set; }
        public string? FirstName { get; set; }
        public string? LastName  { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Address { get; set; }
        public string[] Roles { get; set; } = [];
    }

    public class UpdateAppUserRequest
    {
        public string? FirstName { get; set; }
        public string? LastName  { get; set; }
        [Phone]
        public string? PhoneNumber { get; set; }
        public string? Address   { get; set; }
    }

    public class AssignRoleRequest
    {
        [Required]
        public string UserId { get; set; } = "";
        [Required]
        public string Role   { get; set; } = "";
    }
}
