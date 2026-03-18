using backend.Dtos.Request.User;
using backend.Dtos.Response.User;
using backend.Services.Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.Extensions;

namespace backend.Controllers.User;

[Route("api/users")]
[ApiController]
public class UserController(IUserService service) : ControllerBase
{
    // Retrieves a list of all user accounts in the system, 
    // including their details and assigned roles
    [Authorize(Roles = "Admin,Superadmin")]
    [HttpGet]
    public async Task<ActionResult<List<UserResponse>>> GetAllUSers() =>
        Ok(await service.GetAllUsersAsync());

    // Retrieves a list of user registration or password reset requests 
    // based on the specified status (e.g., "Pending", "Approved", "Rejected"),
    [Authorize(Roles = "Admin,Superadmin")]
    [HttpGet("user-requests")]
    public async Task<ActionResult<List<UserRequestResponse>>> GetUserRequests(string status)
    {
        var requests = await service.GetUserRequestsAsync(status);
        return Ok(requests);
    }

    // Retrieves a list of all available roles in the system, 
    // allowing admins to view and manage role assignments`
    [Authorize(Roles = "Admin,Superadmin")]
    [HttpGet("roles")]
    public async Task<ActionResult<List<RoleResponse>>> GetRoles() =>
        Ok(await service.GetRolesAsync());

    // Creates a new role with the specified name and permissions, 
    // allowing for flexible role-based access control
    [Authorize(Roles = "Admin,Superadmin")]
    [HttpPost("roles/create")]
    public async Task<ActionResult<CreateRoleResponse>> CreateRole(CreateRoleRequest request)
    {
        var currentUser = User.GetCurrentUser();
        if (currentUser <= 0)
            return Unauthorized(new { message = "Invalid user." });

        var response = await service.CreateRoleAsync(request, currentUser);
        return response.Success
            ? Ok(response)
            : BadRequest(response);
    }

    // Creates a new user account with the specified details and role assignments,
    [Authorize(Roles = "Admin,Superadmin")]
    [HttpPost("create-user")]
    public async Task<ActionResult<CreateUserResponse>> CreateUser(CreateUserRequest request)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);
        try
        {
            var currentUser = User.GetCurrentUser();
            if (currentUser <= 0)
                return Unauthorized(new { message = "Invalid user." });
            var response = await service.CreateUserAsync(request, currentUser);
            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            ModelState.AddModelError("UserName", ex.Message);
            return ValidationProblem(ModelState);
        }
    }

    /* Assigns a role to a user, allowing for dynamic role management 
     * and permission changes without needing to update the user's account directly
     */
    [Authorize(Roles = "Admin,Superadmin")]
    [HttpPatch("assign-role/{id:int}")]
    public async Task<ActionResult<UpdateUserResponse>> AssignRole(int id, UpdateUserRequest request)
    {
        /* if (!ModelState.IsValid)
            return ValidationProblem(ModelState);
        try
        { */
            var currentUser = User.GetCurrentUser();
            if (currentUser <= 0)
                return Unauthorized(new { message = "Invalid user." });
            var response = await service.AssignRoleAsync(id, currentUser, request);
            return response.Success ? 
                Ok(response) : 
                BadRequest(response);
        /* }
        catch (ArgumentException ex)
        {
            ModelState.AddModelError("UserName", ex.Message);
            return ValidationProblem(ModelState);
        } */
    }

    /* Retrieves statistics about user accounts, 
     * such as total count, active vs. disabled, pending approvals, etc.
    */
    [Authorize(Roles="Admin,Superadmin")]
    [HttpGet("stats")]
    public async Task<ActionResult> GetUserStats()
    {
        var stats = await service.GetUserStatsAsync();
        return Ok(stats);

    }
    
    // Disables a user account, preventing the user from logging in until re-enabled
    [Authorize(Roles = "Admin,Superadmin")]
    [HttpPatch("disable-user/{id:int}")]
    public async Task<ActionResult<UpdateUserResponse>> DisableUser(int id)
    {
        var currentUser = User.GetCurrentUser();
        if (currentUser <= 0)
            return Unauthorized(new { message = "Invalid user." });
        var response = await service.DisableUserAsync(id, currentUser);
        return response.Success ? Ok(response) : BadRequest(response);
    }

    // Re-enables a user account that was previously disabled
    [Authorize(Roles = "Admin,Superadmin")]
    [HttpPatch("enable-user/{id:int}")]
    public async Task<ActionResult<UpdateUserResponse>> EnableUser(int id)
    {
        var currentUser = User.GetCurrentUser();
        if (currentUser <= 0)
            return Unauthorized(new { message = "Invalid user." });
        var response = await service.EnableUserAsync(id, currentUser);
        return response.Success ? Ok(response) : BadRequest(response);
    }

    // Approves a pending user registration request, allowing the user to log in for the first time
    [Authorize(Roles = "Admin,Superadmin")]
    [HttpPatch("approve-registration")]
    public async Task<ActionResult<UpdateUserResponse>> ApproveRegistration(ApproveRegistrationRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var currentUser = User.GetCurrentUser();
        if (currentUser <= 0)
            return Unauthorized(new { message = "Invalid user." });
        var response = await service.ApproveRegistrationAsync(request, currentUser);

        return response.Success ? Ok(response) : BadRequest(response);
    }

    // ADMIN: approve reset -> generates temp password/code 
    [Authorize(Roles = "Admin,Superadmin")]
    [HttpPatch("approve-reset-password")]
    public async Task<ActionResult<ResetPasswordResponse>> ApproveResetPassword(ApproveResetPasswordRequest request)
    {
        var currentUser = User.GetCurrentUser();
        if (currentUser <= 0)
            return Unauthorized(new { message = "Invalid user." });
        var response = await service.ApproveResetPasswordAsync(request, currentUser);
        return response.Success
            ? Ok(response)
            : BadRequest(response);
    }

    // ADMIN: directly reset any user's password (no pending request needed)
    [Authorize(Roles = "Admin,Superadmin")]
    [HttpPatch("admin-reset-password")]
    public async Task<ActionResult<ResetPasswordResponse>> AdminResetPassword(AdminResetPasswordRequest request)
    {
        var currentUser = User.GetCurrentUser();
        if (currentUser <= 0)
            return Unauthorized(new { message = "Invalid user." });

        var response = await service.AdminResetPasswordAsync(request, currentUser);

        return response.Success
            ? Ok(response)
            : BadRequest(response);
    }

    // Rejects a user registration or password reset request
    [Authorize(Roles = "Admin,Superadmin")]
    [HttpPut("reject-request")]
    public async Task<ActionResult<UpdateUserResponse>> RejectRequest(RejectUserRequestRequest request)
    {
        var currentUser = User.GetCurrentUser();
        if (currentUser <= 0)
            return Unauthorized(new { message = "Invalid user." });

        var response = await service.RejectUserRequestAsync(request, currentUser);
        return response.Success ? Ok(response) : BadRequest(response);
    }

    // Unlocks a user account that has been locked due to too many failed login attempts
    [Authorize(Roles = "Admin,Superadmin")]
    [HttpPut("unlock-user/{id:int}")]
    public async Task<ActionResult<UpdateUserResponse>> UnlockUser(int id)
    {
        var currentUser = User.GetCurrentUser();
        if (currentUser <= 0) return Unauthorized(new { message = "Invalid user." });

        var response = await service.UnlockUserAsync(id, currentUser);
        return response.Success ? Ok(response) : BadRequest(response);
    }
}
