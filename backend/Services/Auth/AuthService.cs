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
    public async Task<IamResponse?> GetIamAsync(int userId)
    {
        var user = await context
            .Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Id == userId);
        
        if (user == null)
            return new IamResponse
            {
                Name = null,
                UserName = null,
                NameIdentifier = null,
                RoleName = null,
                ForcePasswordChange = false
            };

        return new IamResponse
        {
            Name = user.Name,
            UserName = user.UserName,
            NameIdentifier = user.Id.ToString(),
            RoleName = user.Role?.Name,
            ForcePasswordChange = user.ForcePasswordChange
        };
    }

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

        var guestRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == "Guest");
        if (guestRole is null)
        {
            return new AuthResponse
            {
                Success = false,
                Message = "Guest role not found. Seed roles first.",
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

            IsVerified = false,
            RoleId = guestRole.Id,
            ForcePasswordChange = false,
        };

        context.Users.Add(user);
        await context.SaveChangesAsync();

        context.UserRequests.Add(new UserRequests
        {
            UserId = user.Id,
            RequestType = "Account Registration",
            RequestStatus = "Pending",
            RequestDate = DateTime.UtcNow,
        });

        // User Registration Logs
        context.ActivityLogs.Add(new ActivityLogs
        {
            UserId = user.Id,
            UserName = user.UserName,
            ActivityType = "Privilege", // change to account managamanet later on
            Description = "User Registration (Pending Approval)",
            Payload = System.Text.Json.JsonSerializer.Serialize(new { request.Name, request.UserName }),
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
        var user = await context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.UserName == request.UserName);
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

        if (!user.IsVerified)
        {
            context.ActivityLogs.Add(new ActivityLogs
            {
                UserId = user.Id,
                UserName = user.UserName,
                ActivityType = "Authentication",
                Description = "User Login Blocked - Pending Approval",
                Payload = System.Text.Json.JsonSerializer.Serialize(new { request.UserName }),
                IsSuccess = false,
                Timestamp = DateTime.UtcNow,
            });

            await context.SaveChangesAsync();

            return new AuthResponse
            {
                Success = false,
                Message = "Account pending approval. Please contact your administrator.",
                AccessToken = null!,
                RefreshToken = null!,
                ForcePasswordChange = false
            };
        }

        // If an admin issued a temporary password, it is stored in PasswordHash,
        // so normal BCrypt verify works.
        var isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);

        if (!isPasswordValid)
        {
            // Log failed login attempt
            context.ActivityLogs.Add(new ActivityLogs
            {
                UserId = user.Id,
                UserName = user.UserName,
                ActivityType = "Authentication",
                Description = "User Login Failed",
                Payload = System.Text.Json.JsonSerializer.Serialize(new { request.UserName }),
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

        // // include role for token
        // user = await context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.UserName == request.UserName);

        return new AuthResponse
        {
            Success = true,
            Message = "Login successful",
            AccessToken = GenerateToken(user),
            RefreshToken = await GenerateAndSaveRefreshTokenAsync(user),
            ForcePasswordChange = user.ForcePasswordChange
        };
    }

    // Logout: revoke refresh token
    public async Task<AuthResponse> LogoutAsync(int? userId)
    {
        var user = await context.Users.FindAsync(userId);

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
            //Payload = System.Text.Json.JsonSerializer.Serialize(new { user.UserName }),
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

    // Refresh token (your implemented version)
    public async Task<AuthResponse?> RefreshTokenAsync(string? refreshToken)
    {
        var user = await context.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.RefreshToken == refreshToken &&
                u.RefreshTokenExpiry > DateTime.UtcNow);

        if (user is null)
            return null;

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
    public async Task<ForgotPasswordResponse> ForgotPasswordAsync(ForgotPasswordRequest request)
    {
        var username = (request.UserName ?? "").Trim();

        if (string.IsNullOrWhiteSpace(username))
        {
            return new ForgotPasswordResponse
            {
                Success = false,
                Message = "Username is required.",
            };
        }

        var user = await context.Users
            .Include(u => u.UserRequests)
            .FirstOrDefaultAsync(u => u.UserName.ToLower() == username.ToLower());

        // Don't reveal if user exists
        if (user is null)
        {
            return new ForgotPasswordResponse
            {
                Success = true,
                Message = "Reset request submitted. Please wait for admin approval.",
            };
        }

        // Ensure collection exists
        user.UserRequests ??= new List<UserRequests>();

        user.UserRequests.Add(new UserRequests
        {
            RequestType = "Reset Password",
            RequestStatus = "Pending",
            RequestDate = DateTime.UtcNow,
        });

        context.ActivityLogs.Add(new ActivityLogs
        {
            UserId = user.Id,
            UserName = user.UserName,
            ActivityType = "Reset Password Request",
            Description = "Reset Password Request (Pending Admin Approval)",
            Payload = System.Text.Json.JsonSerializer.Serialize(new { request.UserName }),
            IsSuccess = true,
            Timestamp = DateTime.UtcNow,
        });

        await context.SaveChangesAsync();

        return new ForgotPasswordResponse
        {
            Success = true,
            Message = "Reset request submitted. Please wait for admin approval.",
        };
    }

    // USER: after login, reset to new password
    public async Task<ForgotPasswordResponse> UpdatePasswordAsync(ResetPasswordRequest request)
    {
        var newPassword = (request.NewPassword ?? "").Trim();
        if (string.IsNullOrWhiteSpace(newPassword))
            return new ForgotPasswordResponse
            {
                Success = false,
                Message = "New password is required.",
            };

        if (newPassword.Length < 8)
            return new ForgotPasswordResponse
            {
                Success = false,
                Message = "New password must be at least 8 characters long.",
            };

        var user = await context.Users.FirstOrDefaultAsync(u => u.UserName == request.UserName);
        if (user is null)
            return new ForgotPasswordResponse
            {
                Success = false,
                Message = "User not found.",
            };

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        user.ForcePasswordChange = false;

        // invalidate temp code
        /* user.PasswordResetCodeHash = null;
        user.PasswordResetCodeExpiresUtc = null; */

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

        return new ForgotPasswordResponse
        {
            Success = true,
            Message = "Password updated successfully.",
        };
    }

    // -------------------------
    // Helpers
    // -------------------------

    private string GenerateToken(Users user)
    {
        var issuer = configuration["AppSettings:Issuer"];
        var audience = configuration["AppSettings:Audience"];
        var secret = configuration["AppSettings:Token"];

        if (string.IsNullOrWhiteSpace(issuer))
            throw new InvalidOperationException("AppSettings:Issuer is missing.");
        if (string.IsNullOrWhiteSpace(audience))
            throw new InvalidOperationException("AppSettings:Audience is missing.");
        if (string.IsNullOrWhiteSpace(secret))
            throw new InvalidOperationException("AppSettings:Token is missing.");

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Name, user.UserName),
            new Claim(ClaimTypes.GivenName, user.Name),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim("ForcePasswordChange", user.ForcePasswordChange.ToString())
        };

        if (user.Role != null && !string.IsNullOrWhiteSpace(user.Role.Name))
            claims.Add(new Claim(ClaimTypes.Role, user.Role.Name));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: DateTime.UtcNow.AddDays(1), 
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
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
