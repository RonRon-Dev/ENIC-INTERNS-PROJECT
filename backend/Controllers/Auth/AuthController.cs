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
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request)
    {
        var result = await service.RegisterAsync(request);
        return Ok(result);
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        var result = await service.LoginAsync(request);

        if (result is null || result.AccessToken is null || result.RefreshToken is null)
            return Unauthorized(new { message = "Invalid username or password" });

        return Ok(result);
    }

    // USER: request reset (PENDING admin approval, no code returned)
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        var (ok, message, code) = await service.ForgotPasswordAsync(request);

        // IMPORTANT:
        // For your concept, this should NOT return code (admin will approve and send via Viber).
        // So we return only the message.
        return ok ? Ok(new { message }) : BadRequest(new { message });
    }

    // ADMIN: approve reset -> generates temp password/code (admin sends via Viber)
    // You can optionally protect this with [Authorize(Roles = "Admin")] once roles are stable.
    [HttpPost("admin/approve-forgot-password")]
    // [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ApproveForgotPassword([FromBody] ApproveForgotPasswordRequest request)
    {
        var (ok, message, code) = await service.ApproveForgotPasswordAsync(request);
        return ok ? Ok(new { message, code }) : BadRequest(new { message });
    }

    // USER: refresh token
    [HttpPost("refresh-token")]
    public async Task<ActionResult<AuthResponse>> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        var result = await service.RefreshTokenAsync(request);

        if (result is null || string.IsNullOrWhiteSpace(result.AccessToken) || string.IsNullOrWhiteSpace(result.RefreshToken))
            return Unauthorized(new { message = "Invalid refresh token" });

        return Ok(result);
    }

    // USER: after login (when ForcePasswordChange=true), user resets password
    [Authorize]
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        // This comes from JWT claim: ClaimTypes.Name (you set it in GenerateToken)
        var username = User.Identity?.Name;

        if (string.IsNullOrWhiteSpace(username))
            return Unauthorized(new { message = "Invalid token." });

        var (ok, message) = await service.ResetPasswordAsync(username, request);
        return ok ? Ok(new { message }) : BadRequest(new { message });
    }

    // OPTIONAL: logout (revokes refresh token)
    // If your frontend can pass Authorization: Bearer <accessToken>, you can enable this.
    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var authHeader = Request.Headers.Authorization.ToString();
        if (string.IsNullOrWhiteSpace(authHeader))
            return BadRequest(new { message = "Missing Authorization header." });

        var result = await service.LogoutAsync(authHeader);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}