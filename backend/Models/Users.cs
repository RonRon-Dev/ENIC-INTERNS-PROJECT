namespace backend.Models;

public class Users
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    
    public string UserName { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public bool IsVerified { get; set; } = false;
    public bool IsActive { get; set; } = true;
    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; } = DateTime.UtcNow;

    // force user to change password on first login or after reset
    public bool ForcePasswordChange { get; set; } = false;
    
    //reset fields
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiry { get; set; }

    //approval fields for user request
    public bool IsApproved { get; set; } = false;
 
    //Foreign key to Roles
    public int? RoleId { get; set; }
    public Roles? Role { get; set; } = null!;

    //Navigation property to ActivityLogs
    public ICollection<ActivityLogs> ActivityLogs { get; set; } = new List<ActivityLogs>();

    //Navigation Property to UserRequests
    public ICollection<UserRequests> UserRequests { get; set; } = new List<UserRequests>();

}
