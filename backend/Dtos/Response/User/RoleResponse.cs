namespace backend.Dtos.Response.User;

public class RoleResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Icon { get; set; } = string.Empty;
}
