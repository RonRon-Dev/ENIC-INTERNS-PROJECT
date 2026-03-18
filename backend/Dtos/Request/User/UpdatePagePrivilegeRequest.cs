namespace backend.Dtos.Request.User;

public class UpdatePagePrivilegeRequest
{
    public string Url { get; set; } = string.Empty;
    public List<int> RoleIds { get; set; } = [];
    public bool Maintenance { get; set; }
}
