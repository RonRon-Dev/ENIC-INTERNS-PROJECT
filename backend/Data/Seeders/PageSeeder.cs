using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Data.Seeders;

public static class PageSeeder
{
    // Pages and their default allowed role names (empty = all roles).
    // Keep in sync with frontend/src/data/tools.ts.
    private static readonly List<(string Url, string Title, string[] DefaultRoles)> Pages =
    [
        ("/home",                  "Home",               []),
        ("/dashboard",             "Dashboard",          ["Admin", "Superadmin"]),
        ("/users",                 "User Management",    ["Admin", "Superadmin"]),
        ("/inventory/assets",      "Asset List",         ["Admin", "Superadmin", "Operations"]),
        ("/inventory/reports",     "Asset Reports",      ["Superadmin"]),
        ("/operations/automation", "Data Cleaning",      ["Superadmin", "Operations"]),
        ("/finance/expenses",      "Expense Tracker",    ["Superadmin", "Managers"]),
        ("/finance/budget",        "Budget Planner",     ["Superadmin", "Managers"]),
        ("/marketing/campaigns",   "Campaigns",          ["Superadmin", "Marketing"]),
        ("/marketing/leads",       "Leads",              ["Superadmin", "Marketing"]),
        ("/documentation/knowledge-base", "Knowledge Base", ["Superadmin", "Admin", "Operations", "Managers", "Marketing"]),
        ("/documentation/sops",    "SOPs",               ["Superadmin", "Admin", "Operations"]),
        ("/documentation/policies","Policies",           ["Superadmin", "Admin"]),
        ("/it/tickets",            "Tickets",            ["Superadmin", "Admin", "Operations", "Managers", "Marketing"]),
        ("/it/assets",             "IT Assets",          ["Superadmin", "Admin", "IT"]),
        ("/it/system-health",      "System Health",      ["Superadmin", "IT"]),
        ("/ai-assistant",          "AI Assistant",       ["Superadmin", "Admin"]),
    ];

    public static async Task SeedAsync(AppDbContext context)
    {
        foreach (var (url, title, defaultRoles) in Pages)
        {
            var page = await context.Pages
                .Include(p => p.PagePrivileges)
                .FirstOrDefaultAsync(p => p.Url == url);

            if (page == null)
            {
                page = new Pages { Url = url, Title = title };
                context.Pages.Add(page);
                await context.SaveChangesAsync();

                // Seed default privileges
                foreach (var roleName in defaultRoles)
                {
                    var role = await context.Roles.FirstOrDefaultAsync(r => r.Name == roleName);
                    if (role != null)
                    {
                        context.PagePrivileges.Add(new PagePrivileges
                        {
                            PageId = page.Id,
                            RoleId = role.Id,
                        });
                    }
                }

                await context.SaveChangesAsync();
            }
            else if (defaultRoles.Length == 0 && page.PagePrivileges.Count > 0)
            {
                // This page is meant to be open to all roles (empty default).
                // Clear any stale specific entries so it stays unrestricted.
                context.PagePrivileges.RemoveRange(page.PagePrivileges);
                await context.SaveChangesAsync();
            }
        }
    }
}
