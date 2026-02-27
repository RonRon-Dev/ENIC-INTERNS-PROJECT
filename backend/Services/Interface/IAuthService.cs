using backend.Dtos.Request.Auth;
using backend.Dtos.Request.User;
using backend.Dtos.Response.Auth;

namespace backend.Services.Interface;

public interface IAuthService
{
    Task<(bool ok, string message, string? code)>ForgotPasswordAsync(ForgotPasswordRequest request);

   Task<(bool ok, string message, string? code)> ApproveForgotPasswordAsync(ApproveForgotPasswordRequest request);
    Task<(bool ok, string message)> ResetPasswordAsync(string username, ResetPasswordRequest request);

    Task<AuthResponse> RegisterAsync(RegisterRequest request);
    Task<AuthResponse?> LoginAsync(LoginRequest request);
    Task<AuthResponse> LogoutAsync(string token);
    Task<AuthResponse?> RefreshTokenAsync(RefreshTokenRequest request);
}
