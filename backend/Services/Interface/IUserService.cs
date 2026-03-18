using backend.Dtos.Request.User;
using backend.Dtos.Response.User;

namespace backend.Services.Interface;

public interface IUserService
{
    Task<List<UserResponse>> GetAllUsersAsync();
    Task<UserResponse?> GetUserByIdAsync(int id);
    Task<CreateUserResponse> CreateUserAsync(CreateUserRequest user, int currentUser);
    Task<List<RoleResponse>> GetRolesAsync();
    Task<UpdateUserResponse> AssignRoleAsync(int id, int currentUser, UpdateUserRequest user);
    Task<UpdateUserResponse> EnableUserAsync(int id, int currentUser);
    Task<UpdateUserResponse> DisableUserAsync(int id, int currentUser);
    Task<UpdateUserResponse> ApproveRegistrationAsync(
        ApproveRegistrationRequest request,
        int currentUser
    );
    Task<ResetPasswordResponse> ApproveResetPasswordAsync(
        ApproveResetPasswordRequest request,
        int currentUser
    );
    Task<ResetPasswordResponse> AdminResetPasswordAsync(
        AdminResetPasswordRequest request,
        int currentUserId
    );
    Task<List<UserRequestResponse>> GetUserRequestsAsync(string status = "Pending");
    Task<UserStatsResponse> GetUserStatsAsync();
    Task<CreateRoleResponse> CreateRoleAsync(CreateRoleRequest request, int currentUserId);
    Task<UpdateUserResponse> UnlockUserAsync(int id, int currentUserId);
    Task<UpdateUserResponse> RejectUserRequestAsync(
        RejectUserRequestRequest request,
        int currentUserId
    );
}
