namespace backend.Dtos.Response.Settings;

public class AccountResponse
{
    public string Name { get; set; } = string.Empty;
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
}
