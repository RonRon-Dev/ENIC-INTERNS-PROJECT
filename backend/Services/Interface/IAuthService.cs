using backend.Dtos.Request.Auth;
using backend.Dtos.Request.User;
using backend.Dtos.Response.Auth;

namespace backend.Services.Interface;

public interface IAuthService
{
    Task<IamResponse?> GetIamAsync(int userId);
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
    Task<AuthResponse?> LoginAsync(LoginRequest request);
    Task<AuthResponse> LogoutAsync(int? userId);
    Task<AuthResponse?> RefreshTokenAsync(RefreshTokenRequest request);
    Task<ForgotPasswordResponse>ForgotPasswordAsync(ForgotPasswordRequest request);
    Task<ForgotPasswordResponse> UpdatePasswordAsync(ResetPasswordRequest request);
}
