namespace backend.Dtos.Response.Auth;

public class AuthResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? AccessToken { get; set; } = string.Empty;
    public string? RefreshToken { get; set; } = string.Empty;

    public bool ForcePasswordChange { get; set; } = false;

    // Populated when login is blocked due to a rejected/pending request
    public string? RequestStatus { get; set; }
    public string? DecisionReason { get; set; }
}
