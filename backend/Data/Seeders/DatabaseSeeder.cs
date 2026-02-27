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
            "Guest",
            "Admin",
            "SuperAdmin",
            "Developer",
            "Operations",
            "Marketing",
            "Managers",
            "Documentation",
            "IT",
        };

        foreach (var roleName in roles)
        {
            if (!await context.Roles.AnyAsync(r => r.Name == roleName))
            {
                await context.Roles.AddAsync(new Roles { Name = roleName });
            }
        }

        await context.SaveChangesAsync();

        if (!await context.Users.AnyAsync(u => u.UserName == "enic.mis@superadmin"))
        {
            var adminRole = await context.Roles.FirstAsync(r => r.Name == "SuperAdmin");

            await context.Users.AddAsync(
                new Users
                {
                    Name = "John Doe",
                    UserName = "john.doe@superadmin",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Superadmin@123", 10),
                    RoleId = adminRole.Id,
                    CreatedAt = DateTime.UtcNow,
                    IsVerified = true,
                }
            );

            await context.SaveChangesAsync();
        }
        if (!await context.Users.AnyAsync(u => u.UserName == "enic.mis@admin"))
        {
            var adminRole = await context.Roles.FirstAsync(r => r.Name == "Admin");

            await context.Users.AddAsync(
                new Users
                {
                    Name = "Christian Doe",
                    UserName = "christian.doe@admin",
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
