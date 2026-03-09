using System.ComponentModel.DataAnnotations;
namespace backend.Dtos.Request.User;

public class CreateUserRequest
{
  [Required(ErrorMessage = "Name is required.")]
  [StringLength(100, ErrorMessage = "Name must be less than 100 characters.")]
  public string Name { get; set; } = string.Empty;
  [Required(ErrorMessage = "Username is required.")]
  public string UserName { get; set; } = string.Empty;
  [Required(ErrorMessage = "Role is required.")]
  public int? RoleId { get; set; }
}
