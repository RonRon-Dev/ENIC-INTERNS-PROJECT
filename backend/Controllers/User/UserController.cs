using backend.Dtos.Request.User;
using backend.Dtos.Response.User;
using backend.Services.Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers.User;

[Route("api/users")]
[ApiController]
public class UserController(IUserService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<UserResponse>>> GetAllUSers() =>
        Ok(await service.GetAllUsersAsync());

    [HttpGet("{id:int}")]
    public async Task<ActionResult<UserResponse>> GetUserById(int id)
    {
        var user = await service.GetUserByIdAsync(id);
        return user is null ? NotFound(new { message = "User not found" }) : Ok(user);
    }

    [Authorize(Roles = "Admin,Superadmin")]
    [HttpGet("pending-registrations")]
    public async Task<IActionResult> GetPendingRegistrations()
    {
        var pending = await service.GetPendingRegistrationsAsync();
        return Ok(pending);
    }
    

    [Authorize(Roles = "Admin,Superadmin")]
    [HttpPut("approve-registration")]
    public async Task<IActionResult> ApproveRegistration([FromBody] ApproveRegistrationRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var response = await service.ApproveRegistrationAsync(request);

        return response.Success
            ? Ok(new { message = response.Message })
            : BadRequest(new { message = response.Message });
    }

    [Authorize(Roles = "Admin,Superadmin")]
    [HttpGet("roles")]
    public async Task<ActionResult<List<RoleResponse>>> GetRoles()
        => Ok(await service.GetRolesAsync());



    /* [HttpPost]
    public async Task<ActionResult<UserResponse>> CreateUser(CreateUserRequest
    user)
    {
      var createUser = await service.CreateUserAsync(user);
      return CreatedAtAction(nameof(GetUserById), new { id = user.id },
    createUser);
    } */

    // ADMIN: approve reset -> generates temp password/code (admin sends via
    // Viber) You can optionally protect this with [Authorize(Roles = "Admin")]
    // once roles are stable.
    // [Authorize(Roles = "Admin")]
    [Authorize(Roles = "Admin,Superadmin")]
    [HttpPut("approve-reset-password")]
    public async Task<IActionResult> ApproveResetPasswordAsync(ApproveResetPasswordRequest request)
    {
        var response = await service.ApproveResetPasswordAsync(request);
        return response.Success
            ? Ok(new { message = response.Message })
            : BadRequest(new { message = response.Message });
    }

    /* // USER: after login (when ForcePasswordChange=true), user resets password
    [Authorize]
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(ResetPasswordRequest request)
    {
        // This comes from JWT claim: ClaimTypes.Name (you set it in GenerateToken)
        var username = User.Identity?.Name;

        if (string.IsNullOrWhiteSpace(username))
            return Unauthorized(new { message = "Invalid token." });

        var (ok, message) = await service.ResetPasswordAsync(username, request);
        return ok ? Ok(new { message }) : BadRequest(new { message });
    } */
    

}
