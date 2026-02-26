using System.ComponentModel.DataAnnotations;
namespace backend.Dtos.Request.User;

public class CreateUserRequest
{
  // public int id { get; set; }

  [Required]
  [StringLength(100, MinimumLength = 3, ErrorMessage = "Name must be between 3 and 100 characters.")]
  public string Name { get; set; } = string.Empty;
  [Required]
  public string UserName { get; set; } = string.Empty;
  public string Password { get; set; } = string.Empty;
  public int? RoleId { get; set; }
}
