namespace backend.Dtos.Request.User;

public class CreateUserRequest
{
  public string name { get; set; } = string.Empty;
  public string username { get; set; } = string.Empty;
  public string password { get; set; } = string.Empty;
  public int? roleId { get; set; }
}
