using System.ComponentModel.DataAnnotations;
namespace backend.Dtos.Request.User;

public class ApproveResetPasswordRequest
{
    [Required(ErrorMessage = "Username is required")]
    public string UserName { get; set; } = string.Empty;
}
