using backend.Models;
using backend.Dtos.Response;
using backend.Services.Interface;
using backend.Data;
using Microsoft.EntityFrameworkCore;
namespace backend.Services;

public class UserService(AppDbContext context) : IUserService
{

  static List<Users> users = new List<Users>
  {
    new Users { id = 1, name = "John Doe", username = "johndoe", password = "password123" },
    new Users { id = 2, name = "Jane Smith", username = "janesmith", password = "password456" }
  };

  public async Task<List<UserResponse>> GetAllUsersAsync()
    => await context.Users.Select(u => new UserResponse
    {
      id = u.id,
      name = u.name,
      username = u.username,
      role = u.role != null ? new RoleResponse
      {
        id = u.role.id,
        name = u.role.name
      } : null
    }).ToListAsync();

  public async Task<UserResponse?> GetUserByIdAsync(int id)
  {
    var result = await context.Users
      .Where(u => u.id == id)
      .Select(u => new UserResponse
      {
        id = u.id,
        name = u.name,
        username = u.username,
        role = u.role != null ? new RoleResponse
        {
          id = u.role.id,
          name = u.role.name
        } : null
      })
      .FirstOrDefaultAsync();
    return result;
  }

  public Task<UserResponse> CreateUserAsync(Users user)
  {
    throw new NotImplementedException();
  }

  public Task<bool> UpdateUserAsync(int id, Users user)
  {
    throw new NotImplementedException();
  }

  public Task<bool> DeleteUserAsync(int id)
  {
    throw new NotImplementedException();
  }
  
}
