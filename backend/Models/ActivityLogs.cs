namespace backend.Models;

public class ActivityLogs
{
    public long Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string ActivityType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Payload { get; set; } = string.Empty;
    public bool IsSuccess { get; set; }
    public DateTime Timestamp { get; set; }

    //Foreign key to Users
    public int UserId { get; set; }
    public Users? User { get; set; } = null!;
}
