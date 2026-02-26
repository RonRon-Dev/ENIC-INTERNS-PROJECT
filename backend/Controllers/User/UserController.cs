using backend.Dtos.Request.User;
using backend.Dtos.Response.User;
using backend.Services.Interface;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers.User;

[Route("api/users")]
[ApiController]
public class UserController(IUserService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<UserResponse>>> GetAllUSers() =>
        Ok(await service.GetAllUsersAsync());

    [HttpGet("{id}")]
    public async Task<ActionResult<UserResponse>> GetUserById(int id)
    {
        var user = await service.GetUserByIdAsync(id);
        return user is null ? NotFound("User not found") : Ok(value: user);
    }

    /* [HttpPost]
    public async Task<ActionResult<UserResponse>> CreateUser(CreateUserRequest
    user)
    {
      var createUser = await service.CreateUserAsync(user);
      return CreatedAtAction(nameof(GetUserById), new { id = user.id },
    createUser);
    } */

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        var (ok, message) = await service.ResetPasswordAsync(request);
        return ok ? Ok(new { message }) : BadRequest(new { message });
    }
}
