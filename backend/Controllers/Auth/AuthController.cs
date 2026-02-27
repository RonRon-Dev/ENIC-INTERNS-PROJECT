using backend.Dtos.Request.Auth;
using backend.Dtos.Response.Auth;
using backend.Services.Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers.Auth;

[Route("api/auth")]
[ApiController]
public class AuthController(IAuthService service) : ControllerBase
{
    /* [Authorize]
    [HttpGet]
    public IActionResult AuthCheck()
    {
        return Ok("Authenticated");
    }
  
    [Authorize(Roles = "Admin")]
    [HttpGet("admin")]
    public IActionResult AdminCheck()
    {
        return Ok("Admin Access Granted");
    } */

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        var result = await service.RegisterAsync(request);
        return Ok(result);
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        var result = await service.LoginAsync(request);
        return Ok(result);
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        var (ok, message, code) = await service.ForgotPasswordAsync(request);

        // For testing: return the code.
        // When you add email sending, remove "code" from response.
        return ok ? Ok(new { message, code }) : BadRequest(new { message });
    }

    [HttpPost("refresh-token")]
    public async Task<ActionResult<AuthResponse?>> RefreshToken(RefreshTokenRequest request)
    {
        var result = await service.RefreshTokenAsync(request);
        if (result is null || result.AccessToken is null || result.RefreshToken is null)
            return Unauthorized(new { message = "Invalid refresh token" });

        return Ok(result);
    }

    /* [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    { */
}
