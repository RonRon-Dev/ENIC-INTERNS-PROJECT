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
public class AuthController(IAuthService service, IWebHostEnvironment env) : ControllerBase
{
    // Secure = true and SameSite = Strict in production
    private bool IsProduction => env.IsProduction();

    private CookieOptions AccessTokenCookieOptions => new CookieOptions
    {
        HttpOnly = true,
        Secure = IsProduction,
        SameSite = IsProduction ? SameSiteMode.Strict : SameSiteMode.Lax,
        Expires = DateTime.UtcNow.AddMinutes(15)
    };

    private CookieOptions RefreshTokenCookieOptions => new CookieOptions
    {
        HttpOnly = true,
        Secure = IsProduction,
        SameSite = IsProduction ? SameSiteMode.Strict : SameSiteMode.Lax,
        Expires = DateTime.UtcNow.AddDays(7)
    };

    [Authorize]
    [HttpGet("iam")]
    public async Task<ActionResult<IamResponse>> GetIam()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (userId is null)
          return Unauthorized(new IamResponse 
          { 
              Name = null,
              UserName = null,
              NameIdentifier = null,
              RoleName = null,
          });

        var result = await service.GetIamAsync(int.Parse(userId));

        if (result is null)
            return NotFound(new IamResponse 
            { 
                Name = null,
                UserName = null,
                NameIdentifier = null,
                RoleName = null,
            });

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

        Response.Cookies.Append("accessToken", result.AccessToken, AccessTokenCookieOptions);
        Response.Cookies.Append("refreshToken", result.RefreshToken, RefreshTokenCookieOptions);

        return Ok(result);
    }

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

    [HttpPost("refresh-token")]
    public async Task<ActionResult<AuthResponse>> RefreshToken()
    {
        var refreshToken = Request.Cookies["refreshToken"];

        var result = await service.RefreshTokenAsync(refreshToken);

        if (result is null
            || string.IsNullOrWhiteSpace(result.AccessToken)
            || string.IsNullOrWhiteSpace(result.RefreshToken))
            return Unauthorized(new { message = "Invalid refresh token" });

        Response.Cookies.Append("accessToken", result.AccessToken, AccessTokenCookieOptions);
        Response.Cookies.Append("refreshToken", result.RefreshToken, RefreshTokenCookieOptions);

        return Ok(result);
    }

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