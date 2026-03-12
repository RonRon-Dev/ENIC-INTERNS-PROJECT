namespace backend.Dtos.Response.User;

public class CreateRoleResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
}

