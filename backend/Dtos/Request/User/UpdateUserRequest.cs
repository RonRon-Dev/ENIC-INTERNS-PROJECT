using System.ComponentModel.DataAnnotations;
namespace backend.Dtos.Request.User;

public class UpdateUserRequest
{
  // public int id { get; set; }
  [Required]
  [StringLength(100, MinimumLength = 3, ErrorMessage = "Name must be between 3 and 100 characters.")]
  public string? Name { get; set; }

  [Required]
  [StringLength(50, MinimumLength = 3, ErrorMessage = "Username must be between 3 and 50 characters.")]
  public string? UserName { get; set; }

  [Required]
  [StringLength(50, MinimumLength = 8, ErrorMessage = "Password must be between 8 and 50 characters.")] 
  public string? Password { get; set; }
}

