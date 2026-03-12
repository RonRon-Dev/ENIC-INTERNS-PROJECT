using backend.Data;
using backend.Dtos.Request;
using backend.Dtos.Response;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[Route("api/page-privileges")]
[ApiController]
public class PagePrivilegesController(AppDbContext context) : ControllerBase
{
    [HttpGet]
    [Authorize]
    public async Task<ActionResult<List<PagePrivilegeResponse>>> GetAll()
    {
        var pages = await context.Pages
            .AsNoTracking()
            .Include(p => p.PagePrivileges)
            .ThenInclude(pp => pp.Role)
            .ToListAsync();

        return pages.Select(p => new PagePrivilegeResponse
        {
            Url = p.Url,
            Title = p.Title,
            AllowedRoles = p.PagePrivileges.Select(pp => pp.Role.Name.ToLower()).ToList()
        }).ToList();
    }

    [HttpPut]
    [Authorize(Roles = "Admin,Superadmin")]
    public async Task<IActionResult> Update([FromBody] UpdatePagePrivilegeRequest req)
    {
        var url = (req.Url ?? "").Trim();
        if (!url.StartsWith('/')) url = "/" + url;

        var page = await context.Pages
            .Include(p => p.PagePrivileges)
            .FirstOrDefaultAsync(p => p.Url == url);

        if (page == null)
            return NotFound(new { message = "Page not found." });

        context.PagePrivileges.RemoveRange(page.PagePrivileges);

        foreach (var roleId in req.RoleIds.Distinct())
        {
            var roleExists = await context.Roles.AnyAsync(r => r.Id == roleId);
            if (roleExists)
            {
                context.PagePrivileges.Add(new PagePrivileges
                {
                    PageId = page.Id,
                    RoleId = roleId
                });
            }
        }

        await context.SaveChangesAsync();
        return Ok(new { message = "Page privileges updated." });
    }
}
