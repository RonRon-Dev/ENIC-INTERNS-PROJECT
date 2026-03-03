namespace backend.Dtos.Response.Auth;

public class IamResponse
{
    public string? Name { get; set; }
    public string? UserName { get; set; }
    public string? NameIdentifier { get; set; }
    public bool ForcePasswordChange { get; set; } = false;
}
