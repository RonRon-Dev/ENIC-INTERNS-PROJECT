using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using backend.Data;
using backend.Dtos.Request.Auth;
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

        var hashedPassword = BCrypt.Net.BCrypt.HashPassword(request.Password, 10);

        var user = new Users
        {
            Name = request.Name,
            UserName = request.UserName,
            PasswordHash = hashedPassword,
        };

        context.Users.Add(user);
        await context.SaveChangesAsync();

        //User Registration Logs
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

        return new AuthResponse
        {
            Success = true,
            Message = "User registered successfully, contact your administrator for account approval and role assignment.",
            AccessToken = null!,
            RefreshToken = null!,
        };
    }

    // This method handles user login by verifying the provided credentials, 
    // generating a JWT access token and a refresh token, and logging the authentication activity. 
    // If the login is successful, 
    // it returns an AuthResponse containing the tokens; otherwise, it returns an error message.
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
            };
        }

        var isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
        if (!isPasswordValid)
        {
            // Log failed login attempt
            context.ActivityLogs.Add(
                new ActivityLogs
                {
                    UserId = user.Id,
                    UserName = user.UserName,
                    ActivityType = "Authentication",
                    Description = "User Login Failed",
                    Payload = System.Text.Json.JsonSerializer.Serialize(request),
                    IsSuccess = false,
                    Timestamp = DateTime.UtcNow,
                }
            );

            await context.SaveChangesAsync();

            return new AuthResponse
            {
                Success = false,
                Message = "Invalid username or password",
                AccessToken = null!,
                RefreshToken = null!,
            };
        }

        context.ActivityLogs.Add(
            // Log successful login
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

        await context.SaveChangesAsync();

        user = await context
            .Users.Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.UserName == request.UserName);

        return new AuthResponse
        {
            Success = true,
            Message = "Login successful",
            AccessToken = GenerateToken(user!),
            RefreshToken = await GenerateAndSaveRefreshTokenAsync(user!),
        };
    }

    public async Task<AuthResponse> LogoutAsync(string token)
    {
        throw new NotImplementedException();
    }

    // This method handles the token refresh process by validating the provided refresh token,
    public async Task<AuthResponse?> RefreshTokenAsync(string token)
    {
        throw new NotImplementedException();
    }
    
    // This method validates the provided refresh token against the user's stored token and expiry time.
    public async Task<AuthResponse?> RefreshTokenAsync(RefreshTokenRequest request)
    {
        var user = await ValidateRefreshTokenAsync(request.UserId, request.RefreshToken);
        if (user == null)
          return null;

        var result = new AuthResponse
        {
            Success = true,
            Message = "Login successful",
            AccessToken = GenerateToken(user),
            RefreshToken = await GenerateAndSaveRefreshTokenAsync(user),
        };

        return result;
    }


    // JWT generator
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

    // This method generates a secure random refresh token, 
    // which is a base64-encoded string of 32 random bytes.
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


    // Generates a temporary reset code, stores HASH + expiry, logs activity.
    public async Task<(bool ok, string message, string? code)> ForgotPasswordAsync(ForgotPasswordRequest request)
    {
      
        var username = (request.Username ?? "").Trim();

        if (string.IsNullOrWhiteSpace(username))
            return (false, "Username is required.", null);

        var user = await context.Users.FirstOrDefaultAsync(u => u.UserName.ToLower() == username.ToLower());


        if (user is null)
            return (true, "If the account exists, a reset code has been generated.", null);

     
        var code = GenerateResetCode(10);

  
        user.PasswordResetCodeHash = BCrypt.Net.BCrypt.HashPassword(code);
        user.PasswordResetCodeExpiresUtc = DateTime.UtcNow.AddMinutes(10);

        context.ActivityLogs.Add(new ActivityLogs
        {
            UserId = user.Id,
            UserName = user.UserName,
            ActivityType = "Authentication",
            Description = "Forgot Password - Reset Code Generated",
            Payload = System.Text.Json.JsonSerializer.Serialize(new { request.Username }),
            IsSuccess = true,
            Timestamp = DateTime.UtcNow,
        });

        await context.SaveChangesAsync();

       
        return (true, "Reset code generated. Use it to reset your password within 10 minutes.", code);
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
