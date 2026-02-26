namespace backend.Models;

public class Users
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    
    public string Email { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public bool IsVerified { get; set; } = false;

    //reset fields
    public string? ResetToken { get; set; }
    public DateTime? ResetTokenExpiry { get; set; }
    public string? PasswordResetCodeHash { get; set; }
    public DateTime? PasswordResetCodeExpiresUtc { get; set; }

    //Foreign key to Roles
    public int? RoleId { get; set; }
    public Roles? Role { get; set; } = null!;

    //Navigation property to ActivityLogs
    public ICollection<ActivityLogs> ActivityLogs { get; set; } = new List<ActivityLogs>();
}
