namespace backend.Dtos.Request.User;

public class RejectUserRequestRequest
{
    public int RequestId { get; set; }
    public string Reason { get; set; } = string.Empty;
}
