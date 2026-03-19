using System.ComponentModel.DataAnnotations;

namespace backend.Dtos.Request.User;

public class CreateRoleRequest
{
    [Required]
    public string Name { get; set; } = string.Empty;
}
