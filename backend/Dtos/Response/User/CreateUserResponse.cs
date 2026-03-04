namespace backend.Dtos.Response.User;

public class CreateUserResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string TempPassword { get; set; } = string.Empty;
}
