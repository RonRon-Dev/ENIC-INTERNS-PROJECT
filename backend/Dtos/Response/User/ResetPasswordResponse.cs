namespace backend.Dtos.Response.User;

public class ResetPasswordResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string TemporaryPassword { get; set; } = string.Empty;
}
