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

    // Getting a single user by ID with their role, but not including sensitive information like password hash.
    public async Task<UserResponse?> GetUserByIdAsync(int id) =>
        await context
            .Users.Where(u => u.Id == id)
            .Select(u => new UserResponse
            {
                Id = u.Id,
                Name = u.Name,
                UserName = u.UserName,
                Role =
                    u.Role != null ? new RoleResponse { Id = u.Role.Id, Name = u.Role.Name } : null,
            })
            .FirstOrDefaultAsync();

    // Creating a new user with the provided information and a hashed password. The role is assigned based on the RoleId provided in the request.
    public Task<UserResponse> CreateUserAsync(CreateUserRequest user)
    {
        throw new NotImplementedException();
    }

    // This method should be UpdateRoleAsync, ,to be updated
    public Task<bool> UpdateUserAsync(int id, UpdateUserRequest user)
    {
        throw new NotImplementedException();
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

        var user = await context.Users.FirstOrDefaultAsync(u => u.UserName.ToLower() == username.ToLower());
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
    public Task<bool> DeleteUserAsync(int id)
    {
        throw new NotImplementedException();
    }

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
