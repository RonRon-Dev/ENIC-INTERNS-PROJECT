using backend.Dtos.Response.Settings;
using backend.Dtos.Request.Settings;
using backend.Services.Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers.Settings;

[Route("api/settings")]
[ApiController]
[Authorize]
public class AccountController(IAccountService service) : ControllerBase
{
    [HttpPatch]
    [Route("update-account")]
    public async Task<ActionResult<AccountResponse>> UpdateAccount(AccountRequest request)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim is null)
            return Unauthorized(new { message = "Invalid user." });

        var userId = int.Parse(userIdClaim);

        var response = await service.UpdateAccountAsync(userId, request);
        return Ok(response);
    }
}

