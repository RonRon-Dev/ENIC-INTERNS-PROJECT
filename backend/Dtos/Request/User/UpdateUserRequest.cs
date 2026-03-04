using System.ComponentModel.DataAnnotations;

namespace backend.Dtos.Request.User;

public class UpdateUserRequest
{
    [Required(ErrorMessage = "Role is required.")]
    public int RoleId { get; set; }
}
