using backend.Models;
using backend.Dtos.Response;
namespace backend.Services.Interface;

public interface IUserService
{
  Task<List<UserResponse>> GetAllUsersAsync();

  Task<UserResponse?> GetUserByIdAsync(int id);

  Task<UserResponse> CreateUserAsync(Users user);

  Task<bool> UpdateUserAsync(int id, Users user);

  Task<bool> DeleteUserAsync(int id);
}
