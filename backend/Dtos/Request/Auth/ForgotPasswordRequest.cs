using System.ComponentModel.DataAnnotations;
namespace backend.Dtos.Request.Auth;

public class ForgotPasswordRequest
{
    [Required]
    public string UserName { get; set; } = string.Empty;
}
