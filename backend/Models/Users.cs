namespace backend.Models;

public class Users
{
    public int id { get; set; }
    public string name { get; set; } = string.Empty;
    public string username { get; set; } = string.Empty;
    public string password { get; set; } = string.Empty;

    //Foreign key to Roles
    public int roleId { get; set; }
    public Roles? role { get; set; } = null!;

    //Navigation property to ActivityLogs
    public ICollection<ActivityLogs> activityLogs { get; set; } = new List<ActivityLogs>();
}
