using System.ComponentModel.DataAnnotations;

namespace backend.Dtos.Request.User;

public class ResetPasswordRequest
{
    [Required(ErrorMessage = "UserName is required.")]
    public string UserName { get; set; } = string.Empty;

    [Required(ErrorMessage = "NewPassword is required.")]
    public string NewPassword { get; set; } = string.Empty;
}
