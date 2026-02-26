using backend.Dtos.Response.User;
using backend.Dtos.Request.User;
namespace backend.Services.Interface;

public interface IUserService
{
  Task<List<UserResponse>> GetAllUsersAsync();

  Task<UserResponse?> GetUserByIdAsync(int id);

  Task<UserResponse> CreateUserAsync(CreateUserRequest user);

  Task<bool> UpdateUserAsync(int id, UpdateUserRequest user);

  Task<(bool ok, string message)>ResetPasswordAsync(ResetPasswordRequest request);

  Task<bool> DeleteUserAsync(int id);
}
