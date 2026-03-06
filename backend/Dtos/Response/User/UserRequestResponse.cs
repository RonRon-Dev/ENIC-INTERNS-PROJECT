namespace backend.Dtos.Response.User;

public class UserRequestResponse
{
    public int RequestId { get; set; }
    public string RequestType { get; set; } = string.Empty;
    public string RequestStatus { get; set; } = string.Empty;
    public DateTime RequestDate { get; set; }

    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;

    public RoleResponse? CurrentRole { get; set; }
    public bool IsVerified { get; set; }
    public bool IsActive { get; set; }
}
