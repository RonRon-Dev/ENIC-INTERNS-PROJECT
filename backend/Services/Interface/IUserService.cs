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
  Task<List<UserResponse>> GetPendingRegistrationsAsync();
  Task<(bool Success, string Message)> ApproveRegistrationAsync(ApproveRegistrationRequest request);
  Task<List<RoleResponse>> GetRolesAsync();

  Task<ResetPasswordResponse>ApproveResetPasswordAsync(ApproveResetPasswordRequest request);

  Task<bool> DeleteUserAsync(int id);
}
