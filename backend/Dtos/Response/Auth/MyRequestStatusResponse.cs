namespace backend.Dtos.Response.Auth;

public class MyRequestStatusResponse
{
    public string? RequestType { get; set; }
    public string? RequestStatus { get; set; }
    public string? DecisionReason { get; set; }
    public DateTime? RequestDate { get; set; }
    public DateTime? DecisionAtUtc { get; set; }
}
