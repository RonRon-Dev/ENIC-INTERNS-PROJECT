using System.Security.Cryptography;
using backend.Data;
using backend.Models;
using backend.Services.ActivityLogger;
using backend.Dtos.Request.User;
using backend.Dtos.Response.User;
using backend.Services.Interface;
using Microsoft.EntityFrameworkCore;
using BCrypt.Net;

namespace backend.Services.User;

public class UserService(
    AppDbContext context,
    ActivityLoggerService logger) : IUserService
{
    // Getting all users with their roles, but not including sensitive information like password hash.
    public async Task<List<UserResponse>> GetAllUsersAsync() =>
        await context
            .Users
            .Include(u => u.Role)
            .Select(u => new UserResponse
            {
                Id = u.Id,
                Name = u.Name,
                UserName = u.UserName,
                IsVerified = u.IsVerified,
                IsActive = u.IsActive,
                Role = u.Role != null ? new RoleResponse { Id = u.Role.Id, Name = u.Role.Name } : null,
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

    public async Task<List<UserRequestResponse>> GetUserRequestsAsync(string status = "Pending")
    {
        status = (status ?? "Pending").Trim();

        return await context.UserRequests
            .AsNoTracking()
            .Include(r => r.User)
            .ThenInclude(u => u!.Role)
            .Where(r => r.RequestStatus == status)
            .OrderByDescending(r => r.RequestDate)
            .Select(r => new UserRequestResponse
            {
                RequestId = r.Id,
                RequestType = r.RequestType,
                RequestStatus = r.RequestStatus,
                RequestDate = r.RequestDate,

                UserId = r.UserId,
                Name = r.User.Name,
                UserName = r.User.UserName,

                IsVerified = r.User.IsVerified,
                IsActive = r.User.IsActive,

                CurrentRole = r.User.Role != null
                    ? new RoleResponse { Id = r.User.Role.Id, Name = r.User.Role.Name }
                    : null
            })
            .ToListAsync();
    }

    public async Task<List<RoleResponse>> GetRolesAsync() =>
        await context.Roles
            .OrderBy(r => r.Name)
            .Select(r => new RoleResponse { Id = r.Id, Name = r.Name })
            .ToListAsync();

    public async Task<UserStatsResponse> GetUserStatsAsync()
    {
        var total = await context.Users.CountAsync();
        var pending = await context.Users.CountAsync(u => !u.IsVerified);
        var active = await context.Users.CountAsync(u => u.IsActive);
        var deactivated = await context.Users.CountAsync(u => !u.IsActive);

        var assigned = await context.Users
            .Include(u => u.Role)
            .CountAsync(u => u.Role != null && u.Role.Name != "Guest");

        return new UserStatsResponse
        {
            TotalUsers = total,
            PendingUsers = pending,
            ActiveUsers = active,
            DeactivatedUsers = deactivated,
            AssignedUsers = assigned
        };
    }

    // Creating a new user with the provided information and a hashed password. The role is assigned based on the RoleId provided in the request.
    public async Task<CreateUserResponse> CreateUserAsync(CreateUserRequest request, int currentUser)
    {
        var username = request.UserName.Trim().ToLower();
        var exists = await context.Users.AnyAsync(u => u.UserName.ToLower() == username);
        if (exists)
            throw new ArgumentException("Username already exists.");

        var rawPassword = GenerateTempPassword(10);
        var password = BCrypt.Net.BCrypt.HashPassword(rawPassword, 10);

        var authUser = await context.Users.FirstOrDefaultAsync(u => u.Id == currentUser);
        var role = await context.Roles.FirstOrDefaultAsync(r => r.Id == request.RoleId);

        if (role is null)
            throw new ArgumentException("Role not found.");

        var newUser = new Users
        {
            Name = request.Name,
            UserName = request.UserName.Trim(),
            PasswordHash = password,
            RoleId = request.RoleId,
            CreatedAt = DateTime.UtcNow,
            IsVerified = true, 
            ForcePasswordChange = true,
        };

        context.Users.Add(newUser);

        var payload = new 
        { 
            target_user = new 
            {
                id = newUser.Id,
                name = newUser.Name,
                username = newUser.UserName,
                role = role.Name,
                is_verified = newUser.IsVerified,
                ForcePasswordChange = newUser.ForcePasswordChange
            },
            temp_generated_password = true
        };

        await logger.LogAccountManagementAsync(
            authUser.Id,
            authUser.UserName,
            "Admin Created User",
            true,
            payload
        );

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

        await logger.LogPrivilegeChangeAsync(
            authUser.Id,
            authUser.UserName,
            $"Role assigned: {role.Name}",
            true,
            new { name = entity.Name, username = entity.UserName, past_role = pastRole, new_role = role.Name }
        );

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

        var payload = new 
        { 
            name = user.Name,
            username = user.UserName,
            role = user.Role != null ? user.Role.Name : "No Role"
        };

        await logger.LogAccountManagementAsync(
            authUser.Id,
            authUser.UserName,
            "Enable User",
            true,
            payload
        );

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
        user.RefreshToken = null;
        user.RefreshTokenExpiry = null;

        var authUser = await context.Users.FirstOrDefaultAsync(u => u.Id == currentUser);

        var payload = new 
        { 
            name = user.Name,
            username = user.UserName,
            role = user.Role != null ? user.Role.Name : "No Role"
        };

        await logger.LogAccountManagementAsync(
            authUser.Id,
            authUser.UserName,
            "Disable User",
            true,
            payload
        );

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

        var regReq = await context.UserRequests
            .Where(r => r.UserId == user.Id && r.RequestType == "Account Registration" && r.RequestStatus == "Pending")
            .OrderByDescending(r => r.RequestDate)
            .FirstOrDefaultAsync();

        if (regReq != null)
            regReq.RequestStatus = "Approved";

        var authUser = await context.Users.FirstOrDefaultAsync(u => u.Id == currentUser);

        var payload = new 
        { 
            name = user.Name,
            username = user.UserName,
            role = role.Name,
            is_verified = user.IsVerified,
        };

        await logger.LogAccountManagementAsync(
            authUser.Id,
            authUser.UserName,
            "Admin Approved Registration",
            true,
            payload 
        );

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

        var resetReq = user.UserRequests
            .Where(r => r.RequestType == "Reset Password" && r.RequestStatus == "Pending")
            .OrderByDescending(r => r.RequestDate)
            .FirstOrDefault();

        if (resetReq != null)
            resetReq.RequestStatus = "Approved";

        // TEMP password becomes active password (so login works)
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(code, 10);

        user.ForcePasswordChange = true;

        var payload = new 
        { 
            name = user.Name,
            username = user.UserName,
            role = user.Role != null ? user.Role.Name : "No Role",
            generated_temp_password = true
        };

        await logger.LogAccountManagementAsync(
            authUser.Id,
            authUser.UserName,
            "Admin Approved Reset (Temp Password Generated)",
            true,
            payload
        );

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

    private static DateTime PhTime =>
        TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow,
            TimeZoneInfo.FindSystemTimeZoneById(
                OperatingSystem.IsWindows() ? "Singapore Standard Time" : "Asia/Manila"));

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
