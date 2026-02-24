using Microsoft.AspNetCore.Mvc;
using backend.Models;
using backend.Services;
using backend.Dtos.Response;
// using backend.Dtos.Request;
using backend.Services.Interface;

namespace backend.Controllers;

[Route("api/users")]
[ApiController]
public class UserController(IUserService service) : ControllerBase
{
  [HttpGet]
  public async Task<ActionResult<List<UserResponse>>> GetAllUSers()
    => Ok(await service.GetAllUsersAsync());

  [HttpGet("{id}")]
  public async Task<ActionResult<UserResponse>> GetUserById(int id)
  {
    var user = await service.GetUserByIdAsync(id);
    return user is null ?
      NotFound("User not found") :
      Ok(value: user);
  }

  // [HttpPost]
  // public async Task<ActionResult<UserResponse
}
