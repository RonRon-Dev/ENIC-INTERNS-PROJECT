namespace backend.Dtos.Request.Auth;

public class RegisterRequest
{
    public string Name { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
