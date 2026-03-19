using backend.Data;
using backend.Dtos.Request.Pages;
using backend.Dtos.Response.Pages;
using backend.Extensions;
using backend.Models;
using backend.Services.Interface;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace backend.Services.Dashboard;

public class PagesServices(AppDbContext context, IMemoryCache cache) : IPagesService
{
    private const string PagePrivilegesCacheKey = "pages:privileges:list";
    private static readonly MemoryCacheEntryOptions PagePrivilegesCacheOptions = new()
    {
        AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10),
    };

    public async Task<List<PagePrivilegeResponse>> GetPagesAsync()
    {
        if (cache.TryGetValue(PagePrivilegesCacheKey, out List<PagePrivilegeResponse>? cachedPages))
            return cachedPages!;

        var pages = await context
            .Pages.AsNoTracking()
            .Include(p => p.PagePrivileges)
                .ThenInclude(pp => pp.Role)
            .ToListAsync();

        var result = pages
            .Select(p => new PagePrivilegeResponse
            {
                Url = p.Url,
                Title = p.Title,
                AllowedRoles = p.PagePrivileges.Select(pp => pp.Role.Name.ToLower()).ToList(),
                Maintenance = p.IsUnderMaintenance,
            })
            .ToList();

        cache.Set(PagePrivilegesCacheKey, result, PagePrivilegesCacheOptions);

        return result;
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

        page.IsUnderMaintenance = request.Maintenance;
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
        cache.Remove(PagePrivilegesCacheKey);
        return "Page privileges updated successfully.";
    }
}
