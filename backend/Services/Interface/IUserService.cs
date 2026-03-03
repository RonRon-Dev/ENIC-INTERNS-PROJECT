using backend.Dtos.Response.User;
using backend.Dtos.Request.User;
using backend.Dtos.Response.Auth;
namespace backend.Services.Interface;

public interface IUserService
{
  Task<List<UserResponse>> GetAllUsersAsync();

  Task<UserResponse?> GetUserByIdAsync(int id);

  Task<UserResponse> CreateUserAsync(CreateUserRequest user);

  Task<bool> UpdateUserAsync(int id, UpdateUserRequest user);

  // Task<(bool ok, string message)> ApproveForgotPasswordAsync(ApproveForgotPasswordRequest request);

  Task<ResetPasswordResponse>ApproveResetPasswordAsync(ApproveResetPasswordRequest request);

  Task<bool> DeleteUserAsync(int id);
}
