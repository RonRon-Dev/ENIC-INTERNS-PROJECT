using backend.Data;
using backend.Dtos.Request.Pages;
using backend.Dtos.Response.Pages;
using backend.Extensions;
using backend.Models;
using backend.Services.Interface;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.Dashboard;

public class PagesServices(AppDbContext context) : IPagesService
{
    public async Task<List<PagePrivilegeResponse>> GetPagesAsync()
    {
        var pages = await context
            .Pages.AsNoTracking()
            .Include(p => p.PagePrivileges)
                .ThenInclude(pp => pp.Role)
            .ToListAsync();

        return pages
            .Select(p => new PagePrivilegeResponse
            {
                Url = p.Url,
                Title = p.Title,
                AllowedRoles = p.PagePrivileges.Select(pp => pp.Role.Name.ToLower()).ToList(),
            })
            .ToList();
    }

    public async Task<String> UpdatePagesAsync(UpdatePagePrivilegeRequest request)
    {
        var url = (request.Url ?? "").Trim();
        if (!url.StartsWith('/'))
            url = "/" + url;

        var page = await context
            .Pages.Include(p => p.PagePrivileges)
            .FirstOrDefaultAsync(p => p.Url == url);

        if (page == null)
            return $"Page with URL '{url}' not found.";

        context.PagePrivileges.RemoveRange(page.PagePrivileges);

        foreach (var roleId in request.RoleIds.Distinct())
        {
            var roleExists = await context.Roles.AnyAsync(r => r.Id == roleId);
            if (roleExists)
            {
                context.PagePrivileges.Add(
                    new PagePrivileges { PageId = page.Id, RoleId = roleId }
                );
            }
        }

        await context.SaveChangesAsync();
        return "Page privileges updated successfully.";
    }
}
