namespace backend.Dtos.Request.User;

public class ApproveRegistrationRequest
{
    public int UserId { get; set; }
    public int RoleId { get; set; }
}