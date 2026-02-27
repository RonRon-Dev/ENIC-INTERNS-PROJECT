namespace backend.Models;

public class Users
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    
    public string UserName { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public bool IsVerified { get; set; } = false;
    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; } = DateTime.UtcNow;


    // force user to change password on first login or after reset
    public bool ForcePasswordChange { get; set; } = false;

    // user request to admin
    public bool PasswordResetRequested { get; set; } = false;
    public DateTime? PasswordResetRequestedAtUtc { get; set; }
    
    //reset fields
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiry { get; set; }

    // password reset fields
    public string? PasswordResetCodeHash { get; set; }
    public DateTime? PasswordResetCodeExpiresUtc { get; set; }

    //Foreign key to Roles
    public int? RoleId { get; set; }
    public Roles? Role { get; set; } = null!;

    //Navigation property to ActivityLogs
    public ICollection<ActivityLogs> ActivityLogs { get; set; } = new List<ActivityLogs>();
}
