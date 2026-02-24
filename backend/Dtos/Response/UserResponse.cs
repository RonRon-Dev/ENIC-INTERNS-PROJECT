namespace backend.Dtos.Response;

public class UserResponse
{
    public int id { get; set; }
    public string name { get; set; } = string.Empty;
    public string username { get; set; } = string.Empty;
    public RoleResponse? role { get; set; } = null!;
}
