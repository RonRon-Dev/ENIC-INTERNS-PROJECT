using backend.Dtos.Request.Auth;
using backend.Dtos.Request.User;
using backend.Dtos.Response.Auth;

namespace backend.Services.Interface;

public interface IAuthService
{
    Task<ForgotPasswordResponse>ForgotPasswordAsync(ForgotPasswordRequest request);
    Task<ForgotPasswordResponse> UpdatePasswordAsync(ResetPasswordRequest request);
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
    Task<AuthResponse?> LoginAsync(LoginRequest request);
    Task<AuthResponse> LogoutAsync(string token);
    Task<AuthResponse?> RefreshTokenAsync(RefreshTokenRequest request);
}
