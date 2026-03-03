namespace backend.Dtos.Response.Auth;

public class ForgotPasswordResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
}
