namespace backend.Dtos.Request.Auth;

public class ResetPasswordRequest
{
    public string Username { get; set; } = string.Empty;
    public string OtpCode { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}
