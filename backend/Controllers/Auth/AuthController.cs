using backend.Dtos.Request.Auth;
using backend.Dtos.Request.User;
using backend.Dtos.Response.Auth;
using backend.Services.Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace backend.Controllers.Auth;

[Route("api/auth")]
[ApiController]
public class AuthController(IAuthService service) : ControllerBase
{
    [Authorize]
    [HttpGet("iam")]
    public async Task<ActionResult<IamResponse>> GetIam()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (userId is null)
          return Unauthorized();

        var result = await service.GetIamAsync(int.Parse(userId));

        if (result is null)
            return NotFound(new { message = "User not found" });

        return Ok(result);
    }

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

        if (result is null || result.AccessToken is null || result.RefreshToken is null)
            return Unauthorized(result);

        Response.Cookies.Append("accessToken", result.AccessToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = false,
            SameSite = SameSiteMode.Lax,
            /* For Production
            Secure = true,
            SameSite = SameSiteMode.Strict, */
            Expires = DateTime.UtcNow.AddMinutes(15)
        });

        Response.Cookies.Append("refreshToken", result.RefreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = false,
            SameSite = SameSiteMode.Lax,
            /* For Production
            Secure = true,
            SameSite = SameSiteMode.Strict, */
            Expires = DateTime.UtcNow.AddDays(7)
        });

        return Ok(result);
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

    [Authorize]
    [HttpPut("update-password")]
    public async Task<IActionResult> UpdatePassword(ResetPasswordRequest request)
    {
        var response = await service.UpdatePasswordAsync(request);

        return response.Success
            ? Ok(new { message = response.Message })
            : BadRequest(new { message = response.Message });
    }

    // USER: refresh token
    [Authorize]
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
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var result = await service.LogoutAsync(userId);
        Response.Cookies.Delete("refreshToken");
        Response.Cookies.Delete("accessToken");
        return Ok(result);
    }
}
