namespace backend.Dtos.Response.User;

public class UserStatsResponse
{
    public int TotalUsers { get; set; }
    public int PendingUsers { get; set; }
    public int ActiveUsers { get; set; }
    public int DeactivatedUsers { get; set; }
    public int AssignedUsers { get; set; }
}