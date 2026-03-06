using backend.Dtos.Response.User;
using backend.Dtos.Request.User;
namespace backend.Services.Interface;

public interface IUserService
{
  Task<List<UserResponse>> GetAllUsersAsync();

  Task<UserResponse?> GetUserByIdAsync(int id);

  Task<CreateUserResponse> CreateUserAsync(CreateUserRequest user, int currentUser);

  Task<List<RoleResponse>> GetRolesAsync();

  Task<UpdateUserResponse> AssignRoleAsync(int id, UpdateUserRequest user, int currentUser);

  Task<UpdateUserResponse> EnableUserAsync(int id, int currentUser);

  Task<UpdateUserResponse> DisableUserAsync(int id, int currentUser);

  Task<UpdateUserResponse> ApproveRegistrationAsync(ApproveRegistrationRequest request, int currentUser);

  Task<ResetPasswordResponse>ApproveResetPasswordAsync(ApproveResetPasswordRequest request, int currentUser);
  Task<List<UserRequestResponse>> GetUserRequestsAsync(string status = "Pending");
  Task<UserStatsResponse> GetUserStatsAsync();
}
