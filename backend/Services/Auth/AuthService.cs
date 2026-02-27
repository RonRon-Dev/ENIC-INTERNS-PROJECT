using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using backend.Data;
using backend.Dtos.Request.Auth;
using backend.Dtos.Request.User;
using backend.Dtos.Response.Auth;
using backend.Models;
using backend.Services.Interface;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace backend.Services.Auth;

public class AuthService(AppDbContext context, IConfiguration configuration) : IAuthService
{
    // Account Registration and Sending Request to Admin for Approval
    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        var existingUser = await context.Users.FirstOrDefaultAsync(u => u.UserName == request.UserName);

        if (existingUser != null)
        {
            return new AuthResponse
            {
                Success = false,
                Message = "Username already exists",
                AccessToken = null!,
                RefreshToken = null!,
                ForcePasswordChange = false
            };
        }

        var hashedPassword = BCrypt.Net.BCrypt.HashPassword(request.Password, 10);

        var user = new Users
        {
            Name = request.Name,
            UserName = request.UserName,
            PasswordHash = hashedPassword,
            // new users usually not forced to change password
            ForcePasswordChange = false,
            PasswordResetRequested = false
        };

        context.Users.Add(user);
        await context.SaveChangesAsync();

        // User Registration Logs
        context.ActivityLogs.Add(new ActivityLogs
        {
            UserId = user.Id,
            UserName = user.UserName,
            ActivityType = "Authentication",
            Description = "User Registration",
            Payload = System.Text.Json.JsonSerializer.Serialize(request),
            IsSuccess = true,
            Timestamp = DateTime.UtcNow,
        });

        await context.SaveChangesAsync();

        return new AuthResponse
        {
            Success = true,
            Message = "User registered successfully, contact your administrator for account approval and role assignment.",
            AccessToken = null!,
            RefreshToken = null!,
            ForcePasswordChange = false
        };
    }

    // Login
    public async Task<AuthResponse?> LoginAsync(LoginRequest request)
    {
        var user = await context.Users.FirstOrDefaultAsync(u => u.UserName == request.UserName);
        if (user == null)
        {
            return new AuthResponse
            {
                Success = false,
                Message = "User not found",
                AccessToken = null!,
                RefreshToken = null!,
                ForcePasswordChange = false
            };
        }

        // If an admin issued a temporary password, it is stored in PasswordHash,
        // so normal BCrypt verify works.
        var isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);

        // Optional: enforce expiry for temp password
        if (isPasswordValid && user.ForcePasswordChange && user.PasswordResetCodeExpiresUtc is not null)
        {
            if (DateTime.UtcNow > user.PasswordResetCodeExpiresUtc.Value)
            {
                // expire temp password: invalidate login
                context.ActivityLogs.Add(new ActivityLogs
                {
                    UserId = user.Id,
                    UserName = user.UserName,
                    ActivityType = "Authentication",
                    Description = "User Login Failed - Temp Password Expired",
                    Payload = System.Text.Json.JsonSerializer.Serialize(new { request.UserName }),
                    IsSuccess = false,
                    Timestamp = DateTime.UtcNow,
                });

                await context.SaveChangesAsync();

                return new AuthResponse
                {
                    Success = false,
                    Message = "Temporary password expired. Please request a new reset.",
                    AccessToken = null!,
                    RefreshToken = null!,
                    ForcePasswordChange = false
                };
            }
        }

        if (!isPasswordValid)
        {
            // Log failed login attempt
            context.ActivityLogs.Add(new ActivityLogs
            {
                UserId = user.Id,
                UserName = user.UserName,
                ActivityType = "Authentication",
                Description = "User Login Failed",
                Payload = System.Text.Json.JsonSerializer.Serialize(request),
                IsSuccess = false,
                Timestamp = DateTime.UtcNow,
            });

            await context.SaveChangesAsync();

            return new AuthResponse
            {
                Success = false,
                Message = "Invalid username or password",
                AccessToken = null!,
                RefreshToken = null!,
                ForcePasswordChange = false
            };
        }

        // Log successful login
        context.ActivityLogs.Add(new ActivityLogs
        {
            UserId = user.Id,
            UserName = user.UserName,
            ActivityType = "Authentication",
            Description = "User Login Successful",
            Payload = System.Text.Json.JsonSerializer.Serialize(new { request.UserName }),
            IsSuccess = true,
            Timestamp = DateTime.UtcNow,
        });

        await context.SaveChangesAsync();

        // include role for token
        user = await context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.UserName == request.UserName);

        return new AuthResponse
        {
            Success = true,
            Message = "Login successful",
            AccessToken = GenerateToken(user!),
            RefreshToken = await GenerateAndSaveRefreshTokenAsync(user!),
            ForcePasswordChange = user!.ForcePasswordChange
        };
    }

    // Logout: revoke refresh token
    public async Task<AuthResponse> LogoutAsync(string token)
    {
        // Your controller probably passes the access token, but logout should revoke refresh token.
        // We'll treat "token" as access token and read userId from it.
        var userId = TryGetUserIdFromJwt(token);
        if (userId is null)
        {
            return new AuthResponse
            {
                Success = false,
                Message = "Invalid token.",
                AccessToken = null!,
                RefreshToken = null!,
                ForcePasswordChange = false
            };
        }

        var user = await context.Users.FindAsync(userId.Value);
        if (user is null)
        {
            return new AuthResponse
            {
                Success = false,
                Message = "User not found.",
                AccessToken = null!,
                RefreshToken = null!,
                ForcePasswordChange = false
            };
        }

        user.RefreshToken = null;
        user.RefreshTokenExpiry = null;

        context.ActivityLogs.Add(new ActivityLogs
        {
            UserId = user.Id,
            UserName = user.UserName,
            ActivityType = "Authentication",
            Description = "User Logout",
            Payload = "{}",
            IsSuccess = true,
            Timestamp = DateTime.UtcNow,
        });

        await context.SaveChangesAsync();

        return new AuthResponse
        {
            Success = true,
            Message = "Logged out successfully.",
            AccessToken = null!,
            RefreshToken = null!,
            ForcePasswordChange = false
        };
    }

    // Keep your unused RefreshTokenAsync(string token) if interface requires it
    public async Task<AuthResponse?> RefreshTokenAsync(string token)
    {
        // optional: implement later
        throw new NotImplementedException();
    }

    // Refresh token (your implemented version)
    public async Task<AuthResponse?> RefreshTokenAsync(RefreshTokenRequest request)
    {
        var user = await ValidateRefreshTokenAsync(request.UserId, request.RefreshToken);
        if (user == null) return null;

        return new AuthResponse
        {
            Success = true,
            Message = "Token refreshed",
            AccessToken = GenerateToken(user),
            RefreshToken = await GenerateAndSaveRefreshTokenAsync(user),
            ForcePasswordChange = user.ForcePasswordChange
        };
    }

    // -------------------------
    // Forgot Password FLOW
    // -------------------------

    // USER: submits forgot request (NO code yet)
    public async Task<(bool ok, string message, string? code)> ForgotPasswordAsync(ForgotPasswordRequest request)
    {
        var username = (request.Username ?? "").Trim();
        if (string.IsNullOrWhiteSpace(username))
            return (false, "Username is required.", null);

        var user = await context.Users.FirstOrDefaultAsync(u => u.UserName.ToLower() == username.ToLower());

        // Do not reveal if user exists
        if (user is null)
        {
            return (true, "If the account exists, a reset request has been submitted.", null);
        }

        // mark as requested for admin queue
        user.PasswordResetRequested = true;
        user.PasswordResetRequestedAtUtc = DateTime.UtcNow;

        context.ActivityLogs.Add(new ActivityLogs
        {
            UserId = user.Id,
            UserName = user.UserName,
            ActivityType = "PasswordReset",
            Description = "Forgot Password Request (Pending Admin Approval)",
            Payload = System.Text.Json.JsonSerializer.Serialize(new { username = user.UserName }),
            IsSuccess = true,
            Timestamp = DateTime.UtcNow,
        });

        await context.SaveChangesAsync();

        return (true, "Reset request submitted. Please wait for admin approval.", null);
    }

    // ADMIN: approves reset, generates TEMP PASSWORD (code), sets ForcePasswordChange = true
    public async Task<(bool ok, string message, string? code)> ApproveForgotPasswordAsync(ApproveForgotPasswordRequest request)
    {
        var username = (request.Username ?? "").Trim();
        if (string.IsNullOrWhiteSpace(username))
            return (false, "Username is required.", null);

        var user = await context.Users.FirstOrDefaultAsync(u => u.UserName.ToLower() == username.ToLower());
        if (user is null)
            return (false, "User not found.", null);

        if (!user.PasswordResetRequested)
            return (false, "User has no pending reset request.", null);

        var code = GenerateResetCode(10);

        // TEMP password becomes active password (so login works)
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(code);

        // store reset metadata (optional but recommended)
        user.PasswordResetCodeHash = BCrypt.Net.BCrypt.HashPassword(code);
        user.PasswordResetCodeExpiresUtc = DateTime.UtcNow.AddHours(1);

        user.ForcePasswordChange = true;

        // clear request
        user.PasswordResetRequested = false;
        user.PasswordResetRequestedAtUtc = null;

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
        return (true, "Temporary password generated. Send this code to the user.", code);
    }

    // USER: after login, reset to new password
    public async Task<(bool ok, string message)> ResetPasswordAsync(string username, ResetPasswordRequest request)
    {
        var newPassword = (request.NewPassword ?? "").Trim();
        if (string.IsNullOrWhiteSpace(newPassword))
            return (false, "New password is required.");

        if (newPassword.Length < 8)
            return (false, "New password must be at least 8 characters.");

        var user = await context.Users.FirstOrDefaultAsync(u => u.UserName == username);
        if (user is null)
            return (false, "User not found.");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        user.ForcePasswordChange = false;

        // invalidate temp code
        user.PasswordResetCodeHash = null;
        user.PasswordResetCodeExpiresUtc = null;

        context.ActivityLogs.Add(new ActivityLogs
        {
            UserId = user.Id,
            UserName = user.UserName,
            ActivityType = "PasswordReset",
            Description = "User Reset Password Successfully",
            Payload = "{}",
            IsSuccess = true,
            Timestamp = DateTime.UtcNow,
        });

        await context.SaveChangesAsync();

        return (true, "Password updated successfully.");
    }

    // -------------------------
    // Helpers
    // -------------------------

    private string GenerateToken(Users user)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Name, user.UserName),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
        };

        if (user.Role != null)
            claims.Add(new Claim(ClaimTypes.Role, user.Role.Name));

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(configuration.GetValue<string>("AppSettings:Token")!)
        );

        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512);

        var tokenDescriptor = new JwtSecurityToken(
            issuer: configuration.GetValue<string>("AppSettings:Issuer"),
            audience: configuration.GetValue<string>("AppSettings:Audience"),
            claims: claims,
            expires: DateTime.Now.AddDays(1),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(tokenDescriptor);
    }

    private async Task<Users?> ValidateRefreshTokenAsync(int userId, string refreshToken)
    {
        var user = await context.Users.FindAsync(userId);
        if (user is null ||
            user.RefreshToken != refreshToken ||
            user.RefreshTokenExpiry <= DateTime.UtcNow)
        {
            return null;
        }
        return user;
    }

    private string GenerateRefreshToken()
    {
        var randomNumber = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    private async Task<string> GenerateAndSaveRefreshTokenAsync(Users user)
    {
        var refreshToken = GenerateRefreshToken();
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
        await context.SaveChangesAsync();
        return refreshToken;
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

    private int? TryGetUserIdFromJwt(string token)
    {
        try
        {
            // token might be "Bearer xxx"
            var raw = token.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
                ? token["Bearer ".Length..]
                : token;

            var handler = new JwtSecurityTokenHandler();
            var jwt = handler.ReadJwtToken(raw);

            var idClaim = jwt.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(idClaim, out var id))
                return id;

            return null;
        }
        catch
        {
            return null;
        }
    }
}