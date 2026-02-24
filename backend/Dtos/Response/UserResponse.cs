namespace backend.Dtos.Response;

public class UserResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public RoleResponse? Role { get; set; } = null!;
}
