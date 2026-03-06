namespace backend.Dtos.Response.ActivityLogs;

public class ActivityLogUserResponse
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Username { get; set; } = "";
    public string Status { get; set; } = "active"; // active | deactivated | pending
    public string Role { get; set; } = "guest";    // matches frontend enum (lowercase)
}

public class ActivityLogResponse
{
    public string Id { get; set; } = "";
    public ActivityLogUserResponse User { get; set; } = new();
    public string Description { get; set; } = "";
    public string Date { get; set; } = "";  // yyyy-mm-dd
    public string Time { get; set; } = "";  // HH:mm
    public string Type { get; set; } = "authentication"; // authentication | privilege | account management
}