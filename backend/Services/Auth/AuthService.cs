using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using backend.Data;
using backend.Dtos.Request.Auth;
using backend.Dtos.Response.Auth;
using backend.Models;
using backend.Services.Interface;
using BCrypt.Net;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace backend.Services.Auth;

public class AuthService(AppDbContext context, IConfiguration configuration) : IAuthService
{
    // Account Registration and Sending Request to Admin for Approval
    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        var existingUser = await context.Users.FirstOrDefaultAsync(u =>
            u.UserName == request.UserName
        );

        if (existingUser != null)
        {
            return new AuthResponse
            {
                Success = false,
                Message = "Username already exists",
                AccessToken = null!,
                RefreshToken = null!,
            };
        }

        var HashedPassword = BCrypt.Net.BCrypt.HashPassword(request.Password, 10);

        var user = new Users
        {
            Name = request.Name,
            UserName = request.UserName,
            PasswordHash = HashedPassword,
        };

        context.Users.Add(user);

        await context.SaveChangesAsync();

        context.ActivityLogs.Add(
            new ActivityLogs
            {
                UserId = user.Id,
                UserName = user.UserName,
                ActivityType = "Authentication",
                Description = "User Registration",
                Payload = System.Text.Json.JsonSerializer.Serialize(request),
                IsSuccess = true,
                Timestamp = DateTime.UtcNow,
            }
        );

        await context.SaveChangesAsync();

        var result = new AuthResponse
        {
            Success = true,
            Message = "User registered successfully",
            AccessToken = null!,
            RefreshToken = null!,
        };

        return result;
    }

    // This method handles user login by verifying the provided credentials, 
    // generating a JWT access token and a refresh token, and logging the authentication activity. 
    // If the login is successful, 
    // it returns an AuthResponse containing the tokens; otherwise, it returns an error message.
    public async Task<AuthResponse> LoginAsync(LoginRequest request)
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
            };
        }
        var isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
        if (!isPasswordValid)
        {
            context.ActivityLogs.Add(
                new ActivityLogs
                {
                    UserId = user.Id,
                    UserName = user.UserName,
                    ActivityType = "Authentication",
                    Description = "User Login Failed",
                    Payload = System.Text.Json.JsonSerializer.Serialize(request),
                    IsSuccess = true,
                    Timestamp = DateTime.UtcNow,
                }
            );
            return new AuthResponse
            {
                Success = false,
                Message = "Invalid username or password",
                AccessToken = null!,
                RefreshToken = null!,
            };
        }

        context.ActivityLogs.Add(
            new ActivityLogs
            {
                UserId = user.Id,
                UserName = user.UserName,
                ActivityType = "Authentication",
                Description = "User Login Successful",
                Payload = System.Text.Json.JsonSerializer.Serialize(request),
                IsSuccess = true,
                Timestamp = DateTime.UtcNow,
            }
        );

        user = await context
            .Users.Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.UserName == request.UserName);
        var result = new AuthResponse
        {
            Success = true,
            Message = "Login successful",
            AccessToken = GenerateToken(user),
            RefreshToken = await GenerateAndSaveRefreshTokenAsync(user),
        };

        return result;
    }

    // This method is responsible for logging out a user by invalidating the provided token.
    public async Task<AuthResponse> LogoutAsync(string token)
    {
        throw new NotImplementedException();
    }

    // This method handles the token refresh process by validating the provided refresh token,
    public async Task<AuthResponse> RefreshTokenAsync(string token)
    {
        throw new NotImplementedException();
    }

    // This method generates a JWT access token for the authenticated user, 
    // including claims for the user's name, identifier, and role (if available).
    private string GenerateToken(Users user)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Name, user.UserName),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
        };

        if (user.Role != null)
        {
            claims.Add(new Claim(ClaimTypes.Role, user.Role.Name));
        }

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(configuration.GetValue<string>("AppSettings:Token"))
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

    // This method generates a secure random refresh token, 
    // which is a base64-encoded string of 32 random bytes.
    private string GenerateRefreshToken()
    {
        var randomNumber = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    // This method generates a refresh token, saves it to the user's 
    // record in the database along with an expiry time, and returns the generated token.
    private async Task<string> GenerateAndSaveRefreshTokenAsync(Users user)
    {
        var refreshToken = GenerateRefreshToken();
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
        await context.SaveChangesAsync();
        return refreshToken;
    }

    // Implement Forgot Password -- Sending Request to Rest Password to the Admin
    public async Task<(bool ok, string message, string? code)> ForgotPasswordAsync(ForgotPasswordRequest Request)
    {
        throw new NotImplementedException();
    }
    /* public async Task<(bool ok, string message, string? code)>
    ForgotPasswordAsync(ForgotPasswordRequest req)
    {
        var email = (req.Email ?? "").Trim().ToLower();
        if (string.IsNullOrWhiteSpace(email))
            return (false, "Email is required.", null);
  
        var user = await context.Users.FirstOrDefaultAsync(u => u.Email.ToLower()
    == email); if (user is null)
        {
            // Security best practice: don't reveal if email exists
            return (true, "If the email exists, a reset code has been generated.",
    null);
        }
  
        // generate random temporary password / OTP
        var code = GenerateResetCode(10); // e.g., "A7K9P2XQ1Z"
        user.PasswordResetCodeHash = BCrypt.Net.BCrypt.HashPassword(code);
        user.PasswordResetCodeExpiresUtc = DateTime.UtcNow.AddMinutes(10);
  
        await context.SaveChangesAsync();
  
        // NOTE: In production, send code via email.
        // For now, return it so you can test easily.
        return (true, "Reset code generated. Use it to reset your password within
    10 minutes.", code);
    } */
}
