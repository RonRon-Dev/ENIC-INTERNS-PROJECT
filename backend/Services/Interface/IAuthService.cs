using backend.Dtos.Request.Auth;

namespace backend.Services.Interface;

public interface IAuthService
{
    Task<(bool ok, string message, string? code)>ForgotPasswordAsync(ForgotPasswordRequest request);
    Task<(bool ok, string message)>ResetPasswordAsync(ResetPasswordRequest request);
}