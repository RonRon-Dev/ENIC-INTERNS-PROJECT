using System.ComponentModel.DataAnnotations;

namespace backend.Dtos.Request.User;

public class ApproveRegistrationRequest
{
    [Required(ErrorMessage = "UserId is required.")]
    public int? UserId { get; set; }

    [Required(ErrorMessage = "Role is required.")]
    public int? RoleId { get; set; }
}
