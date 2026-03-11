namespace backend.Dtos.Request;

public class UpdatePagePrivilegeRequest
{
    public string Url { get; set; } = string.Empty;
    public List<int> RoleIds { get; set; } = [];
}
