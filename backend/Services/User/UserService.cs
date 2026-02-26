using System.Security.Cryptography;
using backend.Data;
using backend.Dtos.Request.User;
using backend.Dtos.Response.User;
using backend.Services.Interface;
using Microsoft.EntityFrameworkCore;

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

    // This method should be here because it handles the password user password reset using Admin privileges
    // this method is used by Admin to reset user password without OTP code.
    public async Task<(bool ok, string message)> ResetPasswordAsync(ResetPasswordRequest request)
    {
        // This method is implemented in AuthService, not UserService.
        throw new NotImplementedException();
    }
    /* public async Task<(bool ok, string message)> ResetPasswordAsync(ResetPasswordRequest request)
    {
        var email = (request.Email ?? "").Trim().ToLower();
        var code = (request.OtpCode ?? "").Trim();
        var newPassword = (request.NewPassword ?? "").Trim();

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(newPassword))
            return (false, "Email, code, and new password are required.");

        if (newPassword.Length < 8)
            return (false, "New password must be at least 8 characters.");

        var user = await context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email);
        if (user is null)
            return (false, "Invalid reset request.");

        if (user.PasswordResetCodeHash is null || user.PasswordResetCodeExpiresUtc is null)
            return (false, "No active reset request.");

        if (DateTime.UtcNow > user.PasswordResetCodeExpiresUtc.Value)
            return (false, "Reset code expired. Request a new one.");

        var valid = BCrypt.Net.BCrypt.Verify(code, user.PasswordResetCodeHash);
        if (!valid)
            return (false, "Invalid reset code.");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);

        // clear reset fields
        user.PasswordResetCodeHash = null;
        user.PasswordResetCodeExpiresUtc = null;

        await context.SaveChangesAsync();
        return (true, "Password updated successfully.");
    }

    private static string GenerateResetCode(int length)
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no confusing chars like O/0, I/1
        var bytes = RandomNumberGenerator.GetBytes(length);
        var result = new char[length];
        for (int i = 0; i < length; i++)
            result[i] = chars[bytes[i] % chars.Length];
        return new string(result);
    } */

    // Deleting a user by ID. This should also handle any related data cleanup if necessary (e.g., activity logs).
    public Task<bool> DeleteUserAsync(int id)
    {
        throw new NotImplementedException();
    }
}
