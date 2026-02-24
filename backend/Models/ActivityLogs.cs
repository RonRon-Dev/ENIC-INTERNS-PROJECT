namespace backend.Models;

public class ActivityLogs
{
    public long id { get; set; }
    public string userName { get; set; } = string.Empty;
    public string activityType { get; set; } = string.Empty;
    public string description { get; set; } = string.Empty;
    public string payload { get; set; } = string.Empty;
    public string ipAddress { get; set; } = string.Empty;
    public string userAgent { get; set; } = string.Empty;
    public bool isSuccess { get; set; }
    public DateTime timestamp { get; set; }

    //Foreign key to Users
    public int userId { get; set; }
    public Users? user { get; set; } = null!;
}
