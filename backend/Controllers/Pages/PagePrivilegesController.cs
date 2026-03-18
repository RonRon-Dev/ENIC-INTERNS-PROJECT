using backend.Services.Interface;
using backend.Dtos.Response.Pages;
using backend.Dtos.Request.Pages;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers.Pages;

[Route("api/page-privileges")]
[ApiController]
public class PagePrivilegesController(IPagesService service) : ControllerBase
{
    [HttpGet]
    [Authorize]
    public async Task<ActionResult<List<PagePrivilegeResponse>>> GetPages() =>
        Ok(await service.GetPagesAsync());

    [HttpPut]
    [Authorize(Roles = "Admin,Superadmin")]
    public async Task<ActionResult<String>> Update(UpdatePagePrivilegeRequest req)
    {
        var result = await service.UpdatePagesAsync(req);
        if (result.Contains("not found"))
            return NotFound(new { message = result });
        return Ok(new { message = result });
    }
}
