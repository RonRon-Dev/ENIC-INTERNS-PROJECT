namespace backend.Dtos.Response.Pages;

public class PagePrivilegeResponse
{
    public string Url { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public List<string> AllowedRoles { get; set; } = [];
}
