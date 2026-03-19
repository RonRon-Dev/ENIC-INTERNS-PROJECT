using System.Security.Cryptography;
using backend.Data;
using backend.Dtos.Request.User;
using backend.Dtos.Response.User;
using backend.Models;
using backend.Services.ActivityLogger;
using backend.Services.Interface;
using BCrypt.Net;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace backend.Services.User;

public class UserService(
    AppDbContext context,
    ActivityLoggerService logger,
    IMemoryCache cache
) : IUserService
{
    private const string RolesCacheKey = "users:roles:list";
    private static readonly MemoryCacheEntryOptions RolesCacheOptions = new()
    {
        AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10),
    };

    // Getting all users with their roles, but not including sensitive information
    // like password hash.
    public async Task<List<UserResponse>> GetAllUsersAsync()
    {
        var users = await context
            .Users.Include(u => u.Role)
            .Where(u => u.IsVerified)
            .AsNoTracking()
            .ToListAsync();

        return users
            .Select(u => new UserResponse
            {
                Id = u.Id,
                Name = u.Name,
                UserName = u.UserName,
                IsVerified = u.IsVerified,
                IsActive = u.IsActive,
                Role =
                    u.Role != null ? new RoleResponse { Id = u.Role.Id, Name = u.Role.Name } : null,
                Status =
                    (!u.IsActive) ? "Deactivated"
                    : (!u.IsVerified) ? "Pending"
                    : (
                        u.RequiresAdminReset
                        || (u.LockoutEndUtc != null && DateTime.UtcNow < u.LockoutEndUtc)
                    )
                        ? "Locked"
                    : "Active",
            })
            .ToList();
    }

    // Getting a single user by ID with their role, but not including sensitive
    // information like password hash.
    public async Task<UserResponse?> GetUserByIdAsync(int id) =>
        await context
            .Users.Include(u => u.Role)
            .Where(u => u.Id == id)
            .Select(u => new UserResponse
            {
                Id = u.Id,
                Name = u.Name,
                UserName = u.UserName,
                Role =
                    u.Role != null ? new RoleResponse { Id = u.Role.Id, Name = u.Role.Name } : null,
            })
            .FirstOrDefaultAsync();

    public async Task<List<UserRequestResponse>> GetUserRequestsAsync(string status = "Pending")
    {
        status = (status ?? "Pending").Trim();

        return await context
            .UserRequests.AsNoTracking()
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

                DecisionReason = r.DecisionReason,
                DecisionByUserId = r.DecisionByUserId,
                DecisionAtUtc = r.DecisionAtUtc,

                UserId = r.UserId,
                Name = r.User.Name,
                UserName = r.User.UserName,

                IsVerified = r.User.IsVerified,
                IsActive = r.User.IsActive,

                CurrentRole =
                    r.User.Role != null
                        ? new RoleResponse { Id = r.User.Role.Id, Name = r.User.Role.Name }
                        : null,
            })
            .ToListAsync();
    }

    public async Task<List<RoleResponse>> GetRolesAsync()
    {
        if (cache.TryGetValue(RolesCacheKey, out List<RoleResponse>? cachedRoles))
            return cachedRoles!;

        var roles = await context
            .Roles.AsNoTracking()
            .OrderBy(r => r.Name)
            .Select(r => new RoleResponse
            {
                Id = r.Id,
                Name = r.Name,
                Icon = r.Icon,
            })
            .ToListAsync();

        cache.Set(RolesCacheKey, roles, RolesCacheOptions);

        return roles;
    }

    public async Task<UserStatsResponse> GetUserStatsAsync()
    {
        var total = await context.Users.CountAsync(u => u.IsVerified);
        var pending = await context.UserRequests.CountAsync(r => r.RequestStatus == "Pending");
        var active = await context.Users.CountAsync(u => u.IsVerified && u.IsActive);
        var deactivated = await context.Users.CountAsync(u => u.IsVerified && !u.IsActive);

        var assigned = await context
            .Users.Include(u => u.Role)
            .CountAsync(u => u.Role != null && u.Role.Name != "Guest");

        return new UserStatsResponse
        {
            TotalUsers = total,
            PendingUsers = pending,
            ActiveUsers = active,
            DeactivatedUsers = deactivated,
            AssignedUsers = assigned,
        };
    }

    // Creating a new user with the provided information and a hashed password.
    // The role is assigned based on the RoleId provided in the request.
    public async Task<CreateUserResponse> CreateUserAsync(
        CreateUserRequest request,
        int currentUser
    )
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
                ForcePasswordChange = newUser.ForcePasswordChange,
            },
            temp_generated_password = true,
        };

        await logger.LogAccountManagementAsync(
            authUser!.Id,
            authUser!.UserName,
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
    public async Task<UpdateUserResponse> AssignRoleAsync(
        int id,
        int currentUser,
        UpdateUserRequest request
    )
    {
        var entity = await context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == id);

        if (entity is null)
            return new UpdateUserResponse { Success = false, Message = "User not found." };

        var pastRole = entity.Role is null ? "No Role" : entity.Role.Name;
        var role = await context.Roles.FirstOrDefaultAsync(r => r.Id == request.RoleId);
        if (role is null)
            return new UpdateUserResponse { Success = false, Message = "Role not found." };
        entity.RoleId = role.Id;

        var authUser = await context.Users.FirstOrDefaultAsync(u => u.Id == currentUser);
        if (authUser is null)
            return new UpdateUserResponse
            {
                Success = false,
                Message = "Authenticated user not found.",
            };

        var payload = new
        {
            target_user = new
            {
                id = entity.Id,
                name = entity.Name,
                username = entity.UserName,
                past_role = pastRole,
                new_role = role.Name,
            },
        };

        await logger.LogPrivilegeChangeAsync(
            authUser.Id,
            authUser.UserName,
            $"Assign New Role to User (Role: {role.Name})",
            true,
            payload
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
        var user = await context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == id);
        if (user is null)
            return new UpdateUserResponse { Success = false, Message = "User not found." };

        user.IsActive = true;

        var authUser = await context.Users.FirstOrDefaultAsync(u => u.Id == currentUser);

        var payload = new
        {
            tartget_user = new
            {
                id = user.Id,
                name = user.Name,
                username = user.UserName,
                role = user.Role?.Name ?? "No Role",
            },
        };

        await logger.LogPrivilegeChangeAsync(
            authUser!.Id,
            authUser!.UserName,
            $"Enable User {user.UserName}",
            true,
            payload
        );

        await context.SaveChangesAsync();

        return new UpdateUserResponse { Success = true, Message = "User enabled successfully." };
    }

    public async Task<UpdateUserResponse> DisableUserAsync(int id, int currentUser)
    {
        var user = await context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == id);

        if (user is null)
            return new UpdateUserResponse { Success = false, Message = "User not found." };

        user.IsActive = false;
        user.RefreshToken = null;
        user.RefreshTokenExpiry = null;

        var authUser = await context.Users.FirstOrDefaultAsync(u => u.Id == currentUser);

        var payload = new
        {
            target_user = new
            {
                id = user.Id,
                name = user.Name,
                username = user.UserName,
                role = user.Role?.Name ?? "No Role",
            },
        };

        await logger.LogPrivilegeChangeAsync(
            authUser!.Id,
            authUser!.UserName,
            $"Disable User {user.UserName}",
            true,
            payload
        );

        await context.SaveChangesAsync();

        return new UpdateUserResponse { Success = true, Message = "User disabled successfully." };
    }

    public async Task<UpdateUserResponse> ApproveRegistrationAsync(
        ApproveRegistrationRequest request,
        int currentUser
    )
    {
        var user = await context.Users.FirstOrDefaultAsync(u => u.Id == request.UserId);
        if (user is null)
            return new UpdateUserResponse { Success = false, Message = "User not found." };

        var role = await context.Roles.FirstOrDefaultAsync(r => r.Id == request.RoleId);
        if (role is null)
            return new UpdateUserResponse { Success = false, Message = "Role not found." };

        user.RoleId = role.Id;
        user.IsVerified = true;

        var regReq = await context
            .UserRequests.Where(r =>
                r.UserId == user.Id
                && r.RequestType == "Account Registration"
                && r.RequestStatus == "Pending"
            )
            .OrderByDescending(r => r.RequestDate)
            .FirstOrDefaultAsync();

        if (regReq != null)
        {
            regReq.RequestStatus = "Approved";
            regReq.DecisionByUserId = currentUser;
            regReq.DecisionAtUtc = DateTime.UtcNow;
        }

        var authUser = await context.Users.FirstOrDefaultAsync(u => u.Id == currentUser);
        if (authUser is null)
            return new UpdateUserResponse
            {
                Success = false,
                Message = "Authenticated user not found.",
            };

        var payload = new
        {
            target_user = new
            {
                id = user.Id,
                name = user.Name,
                username = user.UserName,
                role = role.Name,
                is_verified = user.IsVerified,
            },
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

    // ADMIN: approves reset, generates TEMP PASSWORD (code), sets
    // ForcePasswordChange = true
    public async Task<ResetPasswordResponse> ApproveResetPasswordAsync(
        ApproveResetPasswordRequest request,
        int currentUser
    )
    {
        var username = (request.UserName).Trim();

        var user = await context
            .Users.Include(u => u.UserRequests)
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.UserName.ToLower() == username.ToLower());

        if (user is null)
            return new ResetPasswordResponse
            {
                Success = false,
                Message = "User not found.",
                TemporaryPassword = "",
            };

        if (
            !user.UserRequests.Any(ur =>
                ur.RequestType == "Reset Password" && ur.RequestStatus == "Pending"
            )
        )
            return new ResetPasswordResponse
            {
                Success = false,
                Message = "No password reset request found for this user.",
                TemporaryPassword = "",
            };

        var code = GenerateTempPassword(10);
        var authUser = await context.Users.FirstOrDefaultAsync(u => u.Id == currentUser);

        if (authUser is null)
            return new ResetPasswordResponse
            {
                Success = false,
                Message = "Authenticated user not found.",
                TemporaryPassword = "",
            };

        var resetReq = user
            .UserRequests.Where(r =>
                r.RequestType == "Reset Password" && r.RequestStatus == "Pending"
            )
            .OrderByDescending(r => r.RequestDate)
            .FirstOrDefault();

        if (resetReq != null)
        {
            resetReq.RequestStatus = "Approved";
            resetReq.DecisionByUserId = currentUser;
            resetReq.DecisionAtUtc = DateTime.UtcNow;
            resetReq.DecisionReason = "Approved";
        }

        // TEMP password becomes active password (so login works)
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(code, 10);

        user.ForcePasswordChange = true;

        var payload = new
        {
            target_user = new
            {
                id = user.Id,
                name = user.Name,
                username = user.UserName,
                role = user.Role != null ? user.Role.Name : "No Role",
                is_verified = user.IsVerified,
                ForcePasswordChange = user.ForcePasswordChange,
            },
            temp_generated_password = true,
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

    // Deleting a user by ID. This should also handle any related data cleanup if
    // necessary (e.g., activity logs).
    public async Task<ResetPasswordResponse> AdminResetPasswordAsync(
        AdminResetPasswordRequest request,
        int currentUserId
    )
    {
        var authUser = await context.Users.FirstOrDefaultAsync(u => u.Id == currentUserId);
        if (authUser is null)
            return new ResetPasswordResponse
            {
                Success = false,
                Message = "Authenticated user not found.",
                TemporaryPassword = "",
            };

        var user = await context.Users.FirstOrDefaultAsync(u => u.Id == request.UserId);
        if (user is null)
            return new ResetPasswordResponse
            {
                Success = false,
                Message = "User not found.",
                TemporaryPassword = "",
            };

        if (!user.IsActive)
            return new ResetPasswordResponse
            {
                Success = false,
                Message = "User account is disabled.",
                TemporaryPassword = "",
            };

        var code = GenerateTempPassword(10);

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(code, 10);
        user.ForcePasswordChange = true;

        var payload = new
        {
            target_user = new
            {
                id = user.Id,
                name = user.Name,
                username = user.UserName,
                role = user.Role != null ? user.Role.Name : "No Role",
                is_verified = user.IsVerified,
                ForcePasswordChange = user.ForcePasswordChange,
            },
            temp_generated_password = true,
        };

        await context.SaveChangesAsync();

        await logger.LogAccountManagementAsync(
            authUser.Id,
            authUser.UserName,
            "Admin Reset User Password",
            true,
            payload
        );

        return new ResetPasswordResponse
        {
            Success = true,
            Message = "Password reset successfully. Temporary password generated.",
            TemporaryPassword = code,
        };
    }

    public async Task<CreateRoleResponse> CreateRoleAsync(
        CreateRoleRequest request,
        int currentUserId
    )
    {
        var name = (request.Name ?? "").Trim();

        var exists = await context.Roles.AnyAsync(r => r.Name.ToLower() == name.ToLower());
        if (exists)
            return new CreateRoleResponse
            {
                Success = false,
                Message = "Role name already exists.",
                Name = "",
            };

        var role = new Roles { Name = name };
        context.Roles.Add(role);

        var admin = await context.Users.FindAsync(currentUserId);

        if (admin is null)
            return new CreateRoleResponse
            {
                Success = false,
                Message = "Authenticated user not found.",
                Name = "",
            };

        await context.SaveChangesAsync();
        cache.Remove(RolesCacheKey);

        await logger.LogPrivilegeChangeAsync(
            admin.Id,
            admin.UserName,
            $"Created New Role: {name}",
            true,
            new { role = name }
        );

        return new CreateRoleResponse
        {
            Success = true,
            Message = "Role created successfully.",
            Name = name,
        };
    }

    public async Task<UpdateUserResponse> RejectUserRequestAsync(
        RejectUserRequestRequest request,
        int currentUserId
    )
    {
        var admin = await context.Users.FindAsync(currentUserId);
        if (admin is null)
            return new UpdateUserResponse
            {
                Success = false,
                Message = "Authenticated user not found.",
            };

        var req = await context
            .UserRequests.Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Id == request.RequestId);

        if (req.RequestStatus != "Pending")
            return new UpdateUserResponse
            {
                Success = false,
                Message = "Only pending requests can be rejected.",
            };

        req.RequestStatus = "Rejected";
        req.DecisionReason = request.Reason?.Trim();
        req.DecisionByUserId = currentUserId;
        req.DecisionAtUtc = DateTime.UtcNow;

        await context.SaveChangesAsync();

        var payload = new
        {
            target_user = new
            {
                id = req.User.Id,
                name = req.User.Name,
                username = req.User.UserName,
                role = req.User.Role != null ? req.User.Role.Name : "No Role",
                is_verified = req.User.IsVerified,
                is_active = req.User.IsActive,
            },
            requestId = req.Id,
            requestType = req.RequestType,
            decidedBy = admin.UserName,
            reason = req.DecisionReason,
        };

        await logger.LogPrivilegeChangeAsync(
            admin.Id,
            admin.UserName,
            $"Rejected User Request (Type: {req.RequestType})",
            true,
            payload
        );

        return new UpdateUserResponse
        {
            Success = true,
            Message = "Request rejected successfully.",
        };
    }

    public async Task<UpdateUserResponse> UnlockUserAsync(int id, int currentUserId)
    {
        var admin = await context.Users.FindAsync(currentUserId);
        if (admin is null)
            return new UpdateUserResponse
            {
                Success = false,
                Message = "Authenticated user not found.",
            };

        var user = await context.Users.FirstOrDefaultAsync(u => u.Id == id);
        if (user is null)
            return new UpdateUserResponse { Success = false, Message = "User not found." };

        user.FailedLoginAttempts = 0;
        user.LockoutEndUtc = null;
        user.RequiresAdminReset = false;

        var payload = new
        {
            target_user = new
            {
                id = user.Id,
                name = user.Name,
                username = user.UserName,
                role = user.Role != null ? user.Role.Name : "No Role",
                is_verified = user.IsVerified,
                is_active = user.IsActive,
                failed_login_attempts = user.FailedLoginAttempts,
                lockout_end_utc = user.LockoutEndUtc,
                requires_admin_reset = user.RequiresAdminReset,
            },
        };

        await logger.LogAccountManagementAsync(
            admin.Id,
            admin.UserName,
            $"Unlocked User Account",
            true,
            payload
        );

        await context.SaveChangesAsync();

        return new UpdateUserResponse { Success = true, Message = "User account unlocked." };
    }

    private static DateTime PhTime =>
        TimeZoneInfo.ConvertTimeFromUtc(
            DateTime.UtcNow,
            TimeZoneInfo.FindSystemTimeZoneById(
                OperatingSystem.IsWindows() ? "Singapore Standard Time" : "Asia/Manila"
            )
        );

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
