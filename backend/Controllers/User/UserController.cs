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
    [Authorize(Roles = "Admin,Superadmin")]
    [HttpGet]
    public async Task<ActionResult<List<UserResponse>>> GetAllUSers() =>
        Ok(await service.GetAllUsersAsync());

    [Authorize(Roles = "Admin,Superadmin")]
    [HttpGet("{id:int}")]
    public async Task<ActionResult<UserResponse>> GetUserById(int id)
    {
        var user = await service.GetUserByIdAsync(id);
        return user is null ? NotFound(new { message = "User not found" }) : Ok(user);
    }

    [Authorize(Roles = "Admin,Superadmin")]
    [HttpGet("user-requests")]
    public async Task<IActionResult> GetUserRequests()
    {
        var pending = await service.GetUserRequestsAsync();
        return Ok(pending);
    }

    [Authorize(Roles = "Admin,Superadmin")]
    [HttpGet("roles")]
    public async Task<ActionResult<List<RoleResponse>>> GetRoles() =>
        Ok(await service.GetRolesAsync());

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

    [Authorize(Roles = "Admin,Superadmin")]
    [HttpPut("assign-role/{id:int}")]
    public async Task<ActionResult<UpdateUserResponse>> AssignRole(int id, UpdateUserRequest request)
    {
        /* if (!ModelState.IsValid)
            return ValidationProblem(ModelState);
        try
        { */
            var currentUser = User.GetCurrentUser();
            if (currentUser <= 0)
                return Unauthorized(new { message = "Invalid user." });
            var response = await service.AssignRoleAsync(id, request, currentUser);
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

    [Authorize(Roles = "Admin,Superadmin")]
    [HttpPut("disable-user/{id:int}")]
    public async Task<ActionResult<UpdateUserResponse>> DisableUser(int id)
    {
        throw new NotImplementedException();
        /* var result = await service.DisableUserAsync(id);
        return result
            ? Ok(new { message = "User disabled successfully." })
            : BadRequest(new { message = "Failed to disable user." }); */
    }

    [Authorize(Roles = "Admin,Superadmin")]
    [HttpPut("enable-user/{id:int}")]
    public async Task<ActionResult<UpdateUserResponse>> EnableUser(int id)
    {
        throw new NotImplementedException();
        /* var result = await service.EnableUserAsync(id);
        return result
            ? Ok(new { message = "User enabled successfully." })
            : BadRequest(new { message = "Failed to enable user." }); */
    }

    [Authorize(Roles = "Admin,Superadmin")]
    [HttpPut("approve-registration")]
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
    [HttpPut("approve-reset-password")]
    public async Task<ActionResult> ApproveResetPasswordAsync(ApproveResetPasswordRequest request)
    {
        var currentUser = User.GetCurrentUser();
        if (currentUser <= 0)
            return Unauthorized(new { message = "Invalid user." });
        var response = await service.ApproveResetPasswordAsync(request, currentUser);
        return response.Success
            ? Ok(new { message = response.Message })
            : BadRequest(new { message = response.Message });
    }
}
