using backend.Dtos.Request.Auth;
using backend.Services.Interface;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[Route("api/auth")]
[ApiController]
public class AuthController(IAuthService auth) : ControllerBase
{
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest req)
    {
        var (ok, message, code) = await auth.ForgotPasswordAsync(req);

        // For testing: return the code.
        // When you add email sending, remove "code" from response.
        return ok ? Ok(new { message, code }) : BadRequest(new { message });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest req)
    {
        var (ok, message) = await auth.ResetPasswordAsync(req);
        return ok ? Ok(new { message }) : BadRequest(new { message });
    }
}