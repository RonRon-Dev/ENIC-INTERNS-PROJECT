using backend.Data;
using backend.Models;
using BCrypt.Net;
using Microsoft.EntityFrameworkCore;

public class DatabaseSeeder
{
    public static async Task SeedAsync(AppDbContext context)
    {
        await context.Database.MigrateAsync();

        var roles = new[]
        {
            new { Name = "Guest", Icon = "User" },
            new { Name = "Admin", Icon = "Shield" },
            new { Name = "Superadmin", Icon = "ShieldCheck" },
            new { Name = "Dev", Icon = "Code" },
            new { Name = "Operations", Icon = "Settings" },
            new { Name = "Marketing", Icon = "Megaphone" },
            new { Name = "Managers", Icon = "Users" },
            new { Name = "Documentations", Icon = "FileText" },
            new { Name = "IT", Icon = "Cpu" },
        };

        foreach (var role in roles)
        {
            if (!await context.Roles.AnyAsync(r => r.Name == role.Name))
            {
                await context.Roles.AddAsync(new Roles { Name = role.Name, Icon = role.Icon });
            }
            await context.SaveChangesAsync();
        }


        const string superadminUsername = "enic.mis@superadmin";
        if (!await context.Users.AnyAsync(u => u.UserName == superadminUsername))
        {
            var adminRole = await context.Roles.FirstAsync(r => r.Name == "Superadmin");

            await context.Users.AddAsync(
                new Users
                {
                    Name = "John Doe",
                    UserName = superadminUsername,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Superadmin@123", 10),
                    RoleId = adminRole.Id,
                    CreatedAt = DateTime.UtcNow,
                    IsVerified = true,
                }
            );

            await context.SaveChangesAsync();
        }

        const string adminUsername = "enic.mis@admin";
        if (!await context.Users.AnyAsync(u => u.UserName == adminUsername))
        {
            var adminRole = await context.Roles.FirstAsync(r => r.Name == "Admin");

            await context.Users.AddAsync(
                new Users
                {
                    Name = "Christian Doe",
                    UserName = adminUsername,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123", 10),
                    RoleId = adminRole.Id,
                    CreatedAt = DateTime.UtcNow,
                    IsVerified = true,
                }
            );

            await context.SaveChangesAsync();
        }
    }
}
