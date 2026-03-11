using System.ComponentModel.DataAnnotations;
namespace backend.Dtos.Request.Settings;

public class AccountRequest
{
    [Required]
    [StringLength(100, ErrorMessage = "Name must be less than 100 characters.")]
    public string Name { get; set; } = string.Empty;

    [Required]
    [StringLength(100, ErrorMessage = "Name must be less than 100 characters.")]
    public string UserName { get; set; } = string.Empty;

    [StringLength(50, ErrorMessage = "Password must be less than 50 characters.")]
    [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$", ErrorMessage = "Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character.")]
    public string Password { get; set; } = string.Empty;
}

