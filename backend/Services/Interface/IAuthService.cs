using backend.Dtos.Request.Auth;
using backend.Dtos.Response.Auth;

namespace backend.Services.Interface;

public interface IAuthService
{
    Task<(bool ok, string message, string? code)>ForgotPasswordAsync(ForgotPasswordRequest request);
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
    Task<AuthResponse?> LoginAsync(LoginRequest request);
    Task<AuthResponse> LogoutAsync(string token);
    Task<AuthResponse> RefreshTokenAsync(string token);
}
