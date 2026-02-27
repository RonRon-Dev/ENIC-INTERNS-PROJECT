namespace backend.Dtos.Request.User;

public class CreateUserRequest
{
  // public int id { get; set; }
  public string Name { get; set; } = string.Empty;
  public string UserName { get; set; } = string.Empty;
  public string Password { get; set; } = string.Empty;
  public int? RoleId { get; set; }
}
