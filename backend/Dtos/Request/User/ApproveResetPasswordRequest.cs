using System.ComponentModel.DataAnnotations;
namespace backend.Dtos.Request.User;

public class ApproveResetPasswordRequest
{
    [Required]
    public string UserName { get; set; } = string.Empty;
}
