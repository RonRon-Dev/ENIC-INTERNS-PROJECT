using System.ComponentModel.DataAnnotations;

namespace backend.Dtos.Request.User;

public class AdminResetPasswordRequest
{
    [Required(ErrorMessage = "User Not Provided")]
    public int UserId { get; set; }
}
