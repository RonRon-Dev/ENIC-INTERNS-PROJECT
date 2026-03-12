namespace backend.Models;

public class UserRequests
{
    public int Id { get; set; }
    public string RequestType { get; set; } = string.Empty;
    public string RequestStatus { get; set; } = "Pending";
    public DateTime RequestDate { get; set; } = DateTime.UtcNow;

    public string? DecisionReason { get; set; }
    public int? DecisionByUserId { get; set; }
    public DateTime? DecisionAtUtc { get; set; }

    //Foreign key to Users
    public int UserId { get; set; }
    public Users User { get; set; } = null!;

}
