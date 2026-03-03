using System.Security.Cryptography;
using backend.Data;
using backend.Models;
using backend.Dtos.Request.User;
using backend.Dtos.Response.User;
using backend.Services.Interface;
using Microsoft.EntityFrameworkCore;
using BCrypt.Net;

namespace backend.Services.User;

public class UserService(AppDbContext context) : IUserService
{
    // Getting all users with their roles, but not including sensitive information like password hash.
    public async Task<List<UserResponse>> GetAllUsersAsync() =>
        await context
            .Users.Select(u => new UserResponse
            {
                Id = u.Id,
                Name = u.Name,
                UserName = u.UserName,
                Role =
                    u.Role != null ? new RoleResponse { Id = u.Role.Id, Name = u.Role.Name } : null,
            })
            .ToListAsync();
    public async Task<UserResponse?> GetUserByIdAsync(int id) =>
        await context.Users
            .Include(u => u.Role)
            .Where(u => u.Id == id)
            .Select(u => new UserResponse
            {
                Id = u.Id,
                Name = u.Name,
                UserName = u.UserName,
                Role = u.Role != null ? new RoleResponse { Id = u.Role.Id, Name = u.Role.Name } : null,
            })
            .FirstOrDefaultAsync();


    //Registration of admin
    public async Task<List<UserResponse>> GetPendingRegistrationsAsync() =>
        await context.Users
            .Include(u => u.Role)
            .Where(u => !u.IsVerified)
            .Select(u => new UserResponse
            {
                Id = u.Id,
                Name = u.Name,
                UserName = u.UserName,
                Role = u.Role != null ? new RoleResponse { Id = u.Role.Id, Name = u.Role.Name } : null,
            })
            .ToListAsync();
    public async Task<(bool Success, string Message)> ApproveRegistrationAsync(ApproveRegistrationRequest request)
    {
        if (request.UserId <= 0)
            return (false, "UserId is required.");

        if (request.RoleId <= 0)
            return (false, "RoleId is required.");

        var user = await context.Users.FirstOrDefaultAsync(u => u.Id == request.UserId);
        if (user is null)
            return (false, "User not found.");

        var role = await context.Roles.FirstOrDefaultAsync(r => r.Id == request.RoleId);
        if (role is null)
            return (false, "Role not found.");

        user.RoleId = role.Id;
        user.IsVerified = true;

        context.ActivityLogs.Add(new ActivityLogs
        {
            UserId = user.Id,
            UserName = user.UserName,
            ActivityType = "User Management",
            Description = $"Registration Approved - Role Assigned: {role.Name}",
            Payload = System.Text.Json.JsonSerializer.Serialize(new { request.UserId, request.RoleId }),
            IsSuccess = true,
            Timestamp = DateTime.UtcNow,
        });

        await context.SaveChangesAsync();
        return (true, $"User approved and assigned role: {role.Name}");
    }

    public async Task<List<RoleResponse>> GetRolesAsync() =>
        await context.Roles
            .OrderBy(r => r.Name)
            .Select(r => new RoleResponse { Id = r.Id, Name = r.Name })
            .ToListAsync();

    // Getting a single user by ID with their role, but not including sensitive information like password hash.
    // public async Task<UserResponse?> GetUserByIdAsync(int id) =>
    //     await context
    //         .Users.Where(u => u.Id == id)
    //         .Select(u => new UserResponse
    //         {
    //             Id = u.Id,
    //             Name = u.Name,
    //             UserName = u.UserName,
    //             Role =
    //                 u.Role != null ? new RoleResponse { Id = u.Role.Id, Name = u.Role.Name } : null,
    //         })
    //         .FirstOrDefaultAsync();

    // Creating a new user with the provided information and a hashed password. The role is assigned based on the RoleId provided in the request.
     public async Task<UserResponse> CreateUserAsync(CreateUserRequest user)
    {
        // Basic implementation. Adjust validations to your needs.
        if (string.IsNullOrWhiteSpace(user.UserName) || string.IsNullOrWhiteSpace(user.Password))
            throw new ArgumentException("UserName and Password are required.");

        var exists = await context.Users.AnyAsync(u => u.UserName == user.UserName);
        if (exists)
            throw new InvalidOperationException("Username already exists.");

        var role = await context.Roles.FirstOrDefaultAsync(r => r.Id == user.RoleId);
        if (role is null)
            throw new InvalidOperationException("Role not found.");

        var hashed = BCrypt.Net.BCrypt.HashPassword(user.Password, 10);

        var entity = new Users
        {
            Name = user.Name,
            UserName = user.UserName,
            PasswordHash = hashed,
            RoleId = role.Id,
            IsVerified = true, // created by admin typically means approved
            ForcePasswordChange = false
        };

        context.Users.Add(entity);

        context.ActivityLogs.Add(new ActivityLogs
        {
            UserId = 0,
            UserName = user.UserName,
            ActivityType = "User Management",
            Description = "Admin Created User",
            Payload = System.Text.Json.JsonSerializer.Serialize(new { user.Name, user.UserName, user.RoleId }),
            IsSuccess = true,
            Timestamp = DateTime.UtcNow,
        });

        await context.SaveChangesAsync();

        return new UserResponse
        {
            Id = entity.Id,
            Name = entity.Name,
            UserName = entity.UserName,
            Role = new RoleResponse { Id = role.Id, Name = role.Name }
        };
    }

    // This method should be UpdateRoleAsync, ,to be updated
     public async Task<bool> UpdateUserAsync(int id, UpdateUserRequest user)
    {
        var entity = await context.Users.FirstOrDefaultAsync(u => u.Id == id);
        if (entity is null) return false;

        // Update allowed fields (adjust based on your UpdateUserRequest)
        if (!string.IsNullOrWhiteSpace(user.Name))
            entity.Name = user.Name;

        if (!string.IsNullOrWhiteSpace(user.UserName))
            entity.UserName = user.UserName;

        // If role update is part of UpdateUserRequest
        if (user.RoleId > 0)
        {
            var role = await context.Roles.FirstOrDefaultAsync(r => r.Id == user.RoleId);
            if (role is null) return false;
            entity.RoleId = role.Id;
        }

        context.ActivityLogs.Add(new ActivityLogs
        {
            UserId = entity.Id,
            UserName = entity.UserName,
            ActivityType = "User Management",
            Description = "User Updated",
            Payload = System.Text.Json.JsonSerializer.Serialize(new { id, user.Name, user.UserName, user.RoleId }),
            IsSuccess = true,
            Timestamp = DateTime.UtcNow,
        });

        await context.SaveChangesAsync();
        return true;
    }

    
    public async Task<bool> DeleteUserAsync(int id)
    {
        var user = await context.Users.FirstOrDefaultAsync(u => u.Id == id);
        if (user is null) return false;

        context.Users.Remove(user);

        context.ActivityLogs.Add(new ActivityLogs
        {
            UserId = id,
            UserName = user.UserName,
            ActivityType = "User Management",
            Description = "User Deleted",
            Payload = System.Text.Json.JsonSerializer.Serialize(new { id }),
            IsSuccess = true,
            Timestamp = DateTime.UtcNow,
        });

        await context.SaveChangesAsync();
        return true;
    }


    // ADMIN: approves reset, generates TEMP PASSWORD (code), sets ForcePasswordChange = true
    public async Task<ResetPasswordResponse> ApproveResetPasswordAsync(ApproveResetPasswordRequest request)
    {
        var username = (request.UserName ?? "").Trim();
        if (string.IsNullOrWhiteSpace(username))
            return new ResetPasswordResponse
            {
                Success = false,
                Message = "Username is required.",
                TemporaryPassword = "",
            };

        var user = await context.Users
            .Include(u => u.UserRequests)
            .FirstOrDefaultAsync(u => u.UserName.ToLower() == username.ToLower());

        if (user is null)
            return new ResetPasswordResponse
            {
                Success = false,
                Message = "User not found.",
                TemporaryPassword = "",
            };

        if (!user.UserRequests.Any(ur => ur.RequestType == "Reset Password" && ur.RequestStatus == "Pending"))
            return new ResetPasswordResponse
            {
                Success = false,
                Message = "No password reset request found for this user.",
                TemporaryPassword = "",
            };

        var code = GenerateResetCode(10);

        // TEMP password becomes active password (so login works)
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(code, 10);

        user.ForcePasswordChange = true;

        context.ActivityLogs.Add(new ActivityLogs
        {
            UserId = user.Id,
            UserName = user.UserName,
            ActivityType = "PasswordReset",
            Description = "Admin Approved Reset (Temp Password Generated)",
            Payload = System.Text.Json.JsonSerializer.Serialize(new { username = user.UserName }),
            IsSuccess = true,
            Timestamp = DateTime.UtcNow,
        });

        await context.SaveChangesAsync();

        // return code to admin (admin will send via Viber manually)
        return new ResetPasswordResponse
        {
            Success = true,
            Message = "Password reset approved. Temporary password generated.",
            TemporaryPassword = code,
        };
    }

    // Deleting a user by ID. This should also handle any related data cleanup if necessary (e.g., activity logs).

    private static string GenerateResetCode(int length)
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        var bytes = RandomNumberGenerator.GetBytes(length);
        var result = new char[length];
        for (int i = 0; i < length; i++)
            result[i] = chars[bytes[i] % chars.Length];
        return new string(result);
    }


}
