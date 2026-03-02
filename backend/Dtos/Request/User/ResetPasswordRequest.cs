namespace backend.Dtos.Request.User;

public class ResetPasswordRequest
{
    public string UserName { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}
