using System.Security.Cryptography;
using backend.Data;
using backend.Dtos.Request.Auth;
using backend.Services.Interface;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class AuthService(AppDbContext context) : IAuthService
{
    public async Task<(bool ok, string message, string? code)> ForgotPasswordAsync(ForgotPasswordRequest req)
    {
        var email = (req.Email ?? "").Trim().ToLower();
        if (string.IsNullOrWhiteSpace(email))
            return (false, "Email is required.", null);

        var user = await context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email);
        if (user is null)
        {
            // Security best practice: don't reveal if email exists
            return (true, "If the email exists, a reset code has been generated.", null);
        }

        // generate random temporary password / OTP
        var code = GenerateResetCode(10); // e.g., "A7K9P2XQ1Z"
        user.PasswordResetCodeHash = BCrypt.Net.BCrypt.HashPassword(code);
        user.PasswordResetCodeExpiresUtc = DateTime.UtcNow.AddMinutes(10);

        await context.SaveChangesAsync();

        // NOTE: In production, send code via email.
        // For now, return it so you can test easily.
        return (true, "Reset code generated. Use it to reset your password within 10 minutes.", code);
    }

    public async Task<(bool ok, string message)> ResetPasswordAsync(ResetPasswordRequest req)
    {
        var email = (req.Email ?? "").Trim().ToLower();
        var code = (req.OtpCode ?? "").Trim();
        var newPassword = (req.NewPassword ?? "").Trim();

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
    }
}