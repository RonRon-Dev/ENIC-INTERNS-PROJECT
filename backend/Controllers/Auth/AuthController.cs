using backend.Dtos.Request.Auth;
using backend.Dtos.Request.User;
using backend.Dtos.Response.Auth;
using backend.Services.Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers.Auth;

[Route("api/auth")]
[ApiController]
public class AuthController(IAuthService service) : ControllerBase
{
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        var result = await service.RegisterAsync(request);
        return Ok(result);
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        try
        {
            var result = await service.LoginAsync(request);

            if (result is null || result.AccessToken is null || result.RefreshToken is null)
                return Unauthorized(result);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    // USER: request reset (PENDING admin approval, no code returned)
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(ForgotPasswordRequest request)
    {
        var response = await service.ForgotPasswordAsync(request);

        return response.Success
            ? Ok(new { message = response.Message })
            : BadRequest(new { message = response.Message });
    }

    [HttpPut("update-password")]
    public async Task<IActionResult> UpdatePassword(ResetPasswordRequest request)
    {
        var response = await service.UpdatePasswordAsync(request);

        return response.Success
            ? Ok(new { message = response.Message })
            : BadRequest(new { message = response.Message });
    }

    // USER: refresh token
    [HttpPost("refresh-token")]
    public async Task<ActionResult<AuthResponse>> RefreshToken(RefreshTokenRequest request)
    {
        var result = await service.RefreshTokenAsync(request);

        if (
            result is null
            || string.IsNullOrWhiteSpace(result.AccessToken)
            || string.IsNullOrWhiteSpace(result.RefreshToken)
        )
            return Unauthorized(new { message = "Invalid refresh token" });

        return Ok(result);
    }

    // OPTIONAL: logout (revokes refresh token)
    // If your frontend can pass Authorization: Bearer <accessToken>, you can
    // enable this.
    [Authorize]
    [HttpDelete("logout")]
    public async Task<IActionResult> Logout()
    {
        var authHeader = Request.Headers.Authorization.ToString();
        if (string.IsNullOrWhiteSpace(authHeader))
            return BadRequest(new { message = "Missing Authorization header." });

        var result = await service.LogoutAsync(authHeader);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
