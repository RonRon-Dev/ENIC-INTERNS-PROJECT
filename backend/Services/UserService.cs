using backend.Models;
using backend.Dtos.Response;
using backend.Dtos.Request.User;
using backend.Services.Interface;
using backend.Data;
using Microsoft.EntityFrameworkCore;
namespace backend.Services;

public class UserService(AppDbContext context) : IUserService
{

  static List<Users> users = new List<Users>
  {
    new Users { Id = 1, Name = "John Doe", UserName = "johndoe", PasswordHash = "password123" },
    new Users { Id = 2, Name = "Jane Smith", UserName = "janesmith", PasswordHash = "password456" }
  };

  public async Task<List<UserResponse>> GetAllUsersAsync()
    => await context.Users.Select(u => new UserResponse
    {
      Id = u.Id,
      Name = u.Name,
      UserName = u.UserName,
      Role = u.Role != null ? new RoleResponse
      {
        Id = u.Role.Id,
        Name = u.Role.Name
      } : null
    }).ToListAsync();

  public async Task<UserResponse?> GetUserByIdAsync(int id)
  {
    var result = await context.Users
      .Where(u => u.Id == id)
      .Select(u => new UserResponse
      {
        Id = u.Id,
        Name = u.Name,
        UserName = u.UserName,
        Role = u.Role != null ? new RoleResponse
        {
          Id = u.Role.Id,
          Name = u.Role.Name
        } : null
      })
      .FirstOrDefaultAsync();
    return result;
  }

  public Task<UserResponse> CreateUserAsync(CreateUserRequest user)
  {
    throw new NotImplementedException();
  }

  public Task<bool> UpdateUserAsync(int id, UpdateUserRequest user)
  {
    throw new NotImplementedException();
  }

  public Task<bool> DeleteUserAsync(int id)
  {
    throw new NotImplementedException();
  }
  
}
