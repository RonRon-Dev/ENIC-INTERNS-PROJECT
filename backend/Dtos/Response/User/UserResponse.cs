namespace backend.Dtos.Response.User;

public class UserResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public bool IsVerified { get; set; }
    public bool IsActive { get; set; }
    public RoleResponse? Role { get; set; } = null!;
    public string Status { get; set; } = "Active";
}
