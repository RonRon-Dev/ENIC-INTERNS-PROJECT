using System.Security.Cryptography;
using backend.Data;
using backend.Models;
using backend.Dtos.Request.User;
using backend.Dtos.Response.User;
using backend.Dtos.Response.Auth;
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

    // Getting a single user by ID with their role, but not including sensitive information like password hash.
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
    public async Task<List<UserResponse>> GetUserRequestsAsync() =>
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

    public async Task<List<RoleResponse>> GetRolesAsync() =>
        await context.Roles
            .OrderBy(r => r.Name)
            .Select(r => new RoleResponse { Id = r.Id, Name = r.Name })
            .ToListAsync();

    // Creating a new user with the provided information and a hashed password. The role is assigned based on the RoleId provided in the request.
    public async Task<CreateUserResponse> CreateUserAsync(CreateUserRequest request, int currentUser)
    {
        // var authUser = await 
        var exists = await context.Users.AnyAsync(u => u.UserName.ToLower() == request.UserName);
        if (exists)
            throw new ArgumentException("Username already exists.");

        var rawPassword = GenerateTempPassword(10);
        var password = BCrypt.Net.BCrypt.HashPassword(rawPassword, 10);

        var authUser = await context.Users.FirstOrDefaultAsync(u => u.Id == currentUser);

        var newUser = new Users
        {
            Name = request.Name,
            UserName = request.UserName,
            PasswordHash = password,
            RoleId = request.RoleId,
            CreatedAt = DateTime.UtcNow,
            IsVerified = true, 
            ForcePasswordChange = true,
        };

        context.Users.Add(newUser);

        var log = new ActivityLogs
        {
            UserId = authUser.Id,
            UserName = authUser.UserName,
            ActivityType = "User Management",
            Description = "Admin Created User",
            Payload = System.Text.Json.JsonSerializer.Serialize(request),
            IsSuccess = true,
            Timestamp = DateTime.UtcNow,
        };

        context.ActivityLogs.Add(log);

        await context.SaveChangesAsync();

        return new CreateUserResponse
        {
            Success = true,
            Message = "User created successfully.",
            TempPassword = rawPassword,
        };
    }

    // This method should be UpdateRoleAsync, ,to be updated
    public async Task<UpdateUserResponse> AssignRoleAsync(int id, UpdateUserRequest request, int currentUser)
    {
        var entity = await context.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (entity is null) 
            return new UpdateUserResponse
            {
                Success = false,
                Message = "User not found.",
            };

        var pastRole = entity.Role is null ? "No Role" : entity.Role.Name;
        var role = await context.Roles.
            FirstOrDefaultAsync(r => r.Id == request.RoleId);
        if (role is null) 
            return new UpdateUserResponse
            {
                Success = false,
                Message = "Role not found.",
            };
        entity.RoleId = role.Id;

        var authUser = await context.Users.FirstOrDefaultAsync(u => u.Id == currentUser);

        context.ActivityLogs.Add(new ActivityLogs
        {
            UserId = authUser.Id,
            UserName = authUser.UserName,
            ActivityType = "Privilege", // will change to um later on
            Description = $"Role assigned: {role.Name}",
            //Description = "Assigned Role to User",
            Payload = System.Text.Json.JsonSerializer.Serialize(new { entity.Name, entity.UserName, PastRole = pastRole,  Role = role.Name }),
            IsSuccess = true,
            Timestamp = DateTime.UtcNow,
        });

        await context.SaveChangesAsync();
        return new UpdateUserResponse
        {
            Success = true,
            Message = "Assgined New Role to User Successfully.",
        };
    }
    
    public async Task<UpdateUserResponse> EnableUserAsync(int id, int currentUser)
    {
        var user = await context.Users.FirstOrDefaultAsync(u => u.Id == id);
        if (user is null) 
            return new UpdateUserResponse
            {
                Success = false,
                Message = "User not found.",
            };

        user.IsActive = true;

        var authUser = await context.Users.FirstOrDefaultAsync(u => u.Id == currentUser);

        context.ActivityLogs.Add(new ActivityLogs
        {
            UserId = authUser.Id,
            UserName = authUser.UserName,
            ActivityType = "User Management",
            Description = "Enabled User",
            Payload = System.Text.Json.JsonSerializer.Serialize(new { user.Name, user.UserName }),
            IsSuccess = true,
            Timestamp = DateTime.UtcNow,
        });

        await context.SaveChangesAsync();

        return new UpdateUserResponse
        {
            Success = true,
            Message = "User enabled successfully.",
        };
    }

    public async Task<UpdateUserResponse> DisableUserAsync(int id, int currentUser)
    {
        var user = await context.Users.FirstOrDefaultAsync(u => u.Id == id);
        if (user is null) 
            return new UpdateUserResponse
            {
                Success = false,
                Message = "User not found.",
            };

        user.IsActive = false;

        var authUser = await context.Users.FirstOrDefaultAsync(u => u.Id == currentUser);

        context.ActivityLogs.Add(new ActivityLogs
        {
            UserId = authUser.Id,
            UserName = authUser.UserName,
            ActivityType = "User Management",
            Description = "Disabled User",
            Payload = System.Text.Json.JsonSerializer.Serialize(new { user.Name, user.UserName }),
            IsSuccess = true,
            Timestamp = DateTime.UtcNow,
        });

        await context.SaveChangesAsync();

        return new UpdateUserResponse
        {
            Success = true,
            Message = "User disabled successfully.",
        };
    }

    public async Task<UpdateUserResponse> ApproveRegistrationAsync(ApproveRegistrationRequest request, int currentUser)
    {
        var user = await context.Users.FirstOrDefaultAsync(u => u.Id == request.UserId);

        if (user is null)
            return new UpdateUserResponse
            {
                Success = false,
                Message = "User not found.",
            };

        var role = await context.Roles.FirstOrDefaultAsync(r => r.Id == request.RoleId);
        if (role is null)
            return new UpdateUserResponse
            {
                Success = false,
                Message = "Role not found.",
            };

        user.RoleId = role.Id;
        user.IsVerified = true;

        var authUser = await context.Users.FirstOrDefaultAsync(u => u.Id == currentUser);

        context.ActivityLogs.Add(new ActivityLogs
        {
            UserId = authUser.Id,
            UserName = authUser.UserName,
            ActivityType = "User Management",
            Description = "Admin Approved Registration",
            Payload = System.Text.Json.JsonSerializer.Serialize(request),
            IsSuccess = true,
            Timestamp = DateTime.UtcNow,
        });

        await context.SaveChangesAsync();
        return new UpdateUserResponse
        {
            Success = true,
            Message = "User Registration Approved Successfully.",
        };
    }

    // ADMIN: approves reset, generates TEMP PASSWORD (code), sets ForcePasswordChange = true
    public async Task<ResetPasswordResponse> ApproveResetPasswordAsync(ApproveResetPasswordRequest request, int currentUser)
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

        var code = GenerateTempPassword(10);
        var authUser = await context.Users.FirstOrDefaultAsync(u => u.Id == currentUser);

        // TEMP password becomes active password (so login works)
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(code, 10);

        user.ForcePasswordChange = true;

        context.ActivityLogs.Add(new ActivityLogs
        {
            UserId = authUser.Id,
            UserName = authUser.UserName,
            ActivityType = "Account Management",
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

    private static string GenerateTempPassword(int length)
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        var bytes = RandomNumberGenerator.GetBytes(length);
        var result = new char[length];
        for (int i = 0; i < length; i++)
            result[i] = chars[bytes[i] % chars.Length];
        return new string(result);
    }
}
