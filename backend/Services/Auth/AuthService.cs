using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using backend.Data;
using backend.Dtos.Request.Auth;
using backend.Dtos.Request.User;
using backend.Dtos.Response.Auth;
using backend.Extensions;
using backend.Models;
using backend.Services.ActivityLogger;
using backend.Services.Interface;
using BCrypt.Net;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace backend.Services.Auth;

public class AuthService(AppDbContext context, IConfiguration configuration, ActivityLoggerService logger) : IAuthService
{
    public async Task<IamResponse?> GetIamAsync(int userId)
    {
        var user = await context.Users.Include(u => u.Role)
                       .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
            return new IamResponse
            {
                Name = null,
                UserName = null,
                NameIdentifier = null,
                RoleName = null,
                ForcePasswordChange = false,
            };

        return new IamResponse
        {
            Name = user.Name,
            UserName = user.UserName,
            NameIdentifier = user.Id.ToString(),
            RoleName = user.Role?.Name,
            ForcePasswordChange = user.ForcePasswordChange,
        };
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        var username = request.UserName.Trim().ToLower();
        var existingUser = await context.Users.FirstOrDefaultAsync(
            u => u.UserName.ToLower() == username);

        if (existingUser != null)
        {
            return new AuthResponse
            {
                Success = false,
                Message = "Username already exists",
                AccessToken = null!,
                RefreshToken = null!,
                ForcePasswordChange = false,
            };
        }

        var guestRole =
            await context.Roles.FirstOrDefaultAsync(r => r.Name == "Guest");
        if (guestRole is null)
        {
            return new AuthResponse
            {
                Success = false,
                Message = "Guest role not found. Seed roles first.",
                AccessToken = null!,
                RefreshToken = null!,
                ForcePasswordChange = false,
            };
        }

        var hashedPassword = BCrypt.Net.BCrypt.HashPassword(request.Password, 10);

        var user = new Users
        {
            Name = request.Name,
            UserName = request.UserName.Trim(),
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
        await logger.LogAuthenticationAsync(user.Id, user.UserName,
                                            "User Registration (Pending Approval)",
                                            true, null);

        await context.SaveChangesAsync();

        return new AuthResponse
        {
            Success = true,
            Message = "User registered successfully, contact your administrator " +
                    "for account approval and role assignment.",
            AccessToken = null!,
            RefreshToken = null!,
            ForcePasswordChange = false,
        };
    }

    public async Task<AuthResponse?> LoginAsync(LoginRequest request)
    {
        var loginUsername = request.UserName.Trim().ToLower();
        var user =
            await context.Users.Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.UserName.ToLower() == loginUsername);
        if (user == null)
        {
            return new AuthResponse
            {
                Success = false,
                Message = "User not found",
                AccessToken = null!,
                RefreshToken = null!,
                ForcePasswordChange = false,
            };
        }

        if (!user.IsVerified)
        {
            // Check their latest registration request for status/reason
            var latestReq = await context.UserRequests
                                .Where(r => r.UserId == user.Id &&
                                            r.RequestType == "Account Registration")
                                .OrderByDescending(r => r.RequestDate)
                                .FirstOrDefaultAsync();

            await logger.LogAuthenticationAsync(
                user.Id, user.UserName, "User Login Blocked - Pending Approval",
                false, null);

            await context.SaveChangesAsync();

            var isRejected = latestReq?.RequestStatus == "Rejected";
            var reason = latestReq?.DecisionReason;
            return new AuthResponse
            {
                Success = false,
                Message =
                  isRejected
                      ? $"Your registration was rejected. Reason: {reason ?? "No reason provided"}."
                      : "Account pending approval. Please contact your " +
                            "administrator.",
                AccessToken = null!,
                RefreshToken = null!,
                ForcePasswordChange = false,
                RequestStatus = latestReq?.RequestStatus ?? "Pending",
                DecisionReason = latestReq?.DecisionReason,
            };
        }

        if (!user.IsActive)
        {
            await logger.LogAuthenticationAsync(
                user.Id, user.UserName, "User Login Blocked - Account Disabled",
                false, null);

            await context.SaveChangesAsync();

            return new AuthResponse
            {
                Success = false,
                Message = "Account is disabled. Please contact your administrator.",
                AccessToken = null!,
                RefreshToken = null!,
                ForcePasswordChange = false,
            };
        }

        if (user.RequiresAdminReset)
        {
            return new AuthResponse
            {
                Success = false,
                Message = "Too many failed attempts. Contact " +
                        "administrator to reset your account.",
                AccessToken = null!,
                RefreshToken = null!,
                ForcePasswordChange = true,
            };
        }

        if (user.LockoutEndUtc.HasValue &&
            DateTime.UtcNow < user.LockoutEndUtc.Value)
        {
            var remaining = (int)Math.Ceiling(
                (user.LockoutEndUtc.Value - DateTime.UtcNow).TotalMinutes);

            await logger.LogAuthenticationAsync(
                user.Id, user.UserName,
                "User Login Blocked - Account Temporarily Locked", false,
                new { RemainingLockoutMinutes = remaining });

            return new AuthResponse
            {
                Success = false,
                Message = $"Account locked. Try again in {remaining} minute(s).",
                AccessToken = null!,
                RefreshToken = null!,
                ForcePasswordChange = false,
            };
        }

        // Lockout expired: clear lock time but keep attempt count
        if (user.LockoutEndUtc.HasValue &&
            DateTime.UtcNow >= user.LockoutEndUtc.Value)
        {
            user.LockoutEndUtc = null;
            await context.SaveChangesAsync();
        }

        var isPasswordValid =
            BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);

        if (!isPasswordValid)
        {
            user.FailedLoginAttempts += 1;

            // 5th failed attempt: hard lock (admin reset required)
            if (user.FailedLoginAttempts >= 5)
            {
                user.RequiresAdminReset = true;
                user.ForcePasswordChange = true;

                await logger.LogAuthenticationAsync(
                    user.Id, user.UserName,
                    "Account Hard-Locked (5 failed login attempts) - Requires Admin " +
                        "Reset",
                    false, new { request.UserName });

                await context.SaveChangesAsync();

                return new AuthResponse
                {
                    Success = false,
                    Message = "Too many failed attempts. Contact " +
                            "administrator to reset your account.",
                    AccessToken = null!,
                    RefreshToken = null!,
                    ForcePasswordChange = true,
                };
            }

            // 3rd failed attempt ONLY: lock for 2 minutes
            if (user.FailedLoginAttempts == 3)
            {
                user.LockoutEndUtc = DateTime.UtcNow.AddMinutes(2);

                await logger.LogAuthenticationAsync(
                    user.Id, user.UserName,
                    "Account Temporarily Locked (3 failed login attempts) - 2 Minute " +
                        "Lockout",
                    false, null);

                await context.SaveChangesAsync();

                return new AuthResponse
                {
                    Success = false,
                    Message = "Too many failed attempts. Account locked for 2 minutes.",
                    AccessToken = null!,
                    RefreshToken = null!,
                    ForcePasswordChange = false,
                };
            }

            // 1st, 2nd, 4th attempt: invalid credentials
            await logger.LogAuthenticationAsync(
                user.Id, user.UserName, "User Login Failed - Invalid Credentials",
                false, null);

            await context.SaveChangesAsync();

            return new AuthResponse
            {
                Success = false,
                Message = "Invalid username or password",
                AccessToken = null!,
                RefreshToken = null!,
                ForcePasswordChange = false,
            };
        }

        // Log successful login
        await logger.LogAuthenticationAsync(user.Id, user.UserName,
                                            "User Login Successful", true, null);

        user.FailedLoginAttempts = 0;
        user.LockoutEndUtc = null;
        user.RequiresAdminReset = false;

        await context.SaveChangesAsync();

        var newRefreshToken = await GenerateAndSaveRefreshTokenAsync(user);

        return new AuthResponse
        {
            Success = true,
            Message = "Login successful",
            RefreshToken = newRefreshToken,
            AccessToken = GenerateToken(user, newRefreshToken),
            ForcePasswordChange = user.ForcePasswordChange,
        };
    }

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
                ForcePasswordChange = false,
            };
        }

        user.RefreshToken = null;
        user.RefreshTokenExpiry = null;

        await logger.LogAuthenticationAsync(user.Id, user.UserName, "User Logout",
                                            true, null);

        await context.SaveChangesAsync();

        return new AuthResponse
        {
            Success = true,
            Message = "Logged out successfully.",
            AccessToken = null!,
            RefreshToken = null!,
            ForcePasswordChange = false,
        };
    }

    public async Task<AuthResponse?> RefreshTokenAsync(string? refreshToken)
    {
        var user =
            await context.Users.Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.RefreshToken == refreshToken &&
                                          u.RefreshTokenExpiry > DateTime.UtcNow);

        if (user is null)
            return null;

        var newRefreshToken = await GenerateAndSaveRefreshTokenAsync(user);

        return new AuthResponse
        {
            Success = true,
            Message = "Token refreshed",
            AccessToken = GenerateToken(user, newRefreshToken),
            RefreshToken = newRefreshToken,
            ForcePasswordChange = user.ForcePasswordChange,
        };
    }

    // USER: submits forgot request
    public async Task<ForgotPasswordResponse>
    ForgotPasswordAsync(ForgotPasswordRequest request)
    {
        var username = (request.UserName ?? "").Trim().ToLower();

        if (string.IsNullOrWhiteSpace(username))
        {
            return new ForgotPasswordResponse
            {
                Success = false,
                Message = "Username is required.",
            };
        }

        var user = await context.Users.Include(u => u.UserRequests)
                       .FirstOrDefaultAsync(u => u.UserName.ToLower() == username);

        if (user is null)
        {
            return new ForgotPasswordResponse
            {
                Success = true,
                Message = "Reset request submitted. Please wait for admin approval.",
            };
        }

        // Deactivated users cannot request a password reset
        if (!user.IsActive)
        {
            await logger.LogAuthenticationAsync(
                user.Id, user.UserName,
                "Password Reset Request Blocked - Account Disabled", false,
                new { request.UserName });

            return new ForgotPasswordResponse
            {
                Success = false,
                Message = "Your account has been deactivated. Please contact your " +
                        "administrator.",
            };
        }

        // Rejected self-registered users cannot request a password reset
        if (!user.IsVerified)
        {
            var latestRegReq =
                user.UserRequests?.Where(r => r.RequestType == "Account Registration")
                    .OrderByDescending(r => r.RequestDate)
                    .FirstOrDefault();

            var status = latestRegReq?.RequestStatus;

            if (status == "Rejected")
            {
                await logger.LogAuthenticationAsync(
                    user.Id, user.UserName,
                    "Password Reset Request Blocked - Registration Rejected", false,
                    new { request.UserName });

                return new ForgotPasswordResponse
                {
                    Success = false,
                    Message =
                      $"Your registration was rejected. Reason: {latestRegReq.DecisionReason ?? "No reason provided"}. You cannot reset your password.",
                };
            }

            logger.LogAuthenticationAsync(
                user.Id, user.UserName,
                "Password Reset Request Blocked - Account Pending Approval", false,
                new { request.UserName });

            return new ForgotPasswordResponse
            {
                Success = false,
                Message = "Your account is still pending approval. You cannot reset " +
                        "your password yet.",
            };
        }

        user.UserRequests ??= new List<UserRequests>();

        var pendingReset = user.UserRequests
            .Where(r => r.RequestType == "Reset Password" &&
                        r.RequestStatus == "Pending")
            .OrderByDescending(r => r.RequestDate)
            .FirstOrDefault();

        if (pendingReset != null)
        {
            await logger.LogAuthenticationAsync(
                user.Id, user.UserName,
                "Password Reset Request Blocked - Existing Pending Request", false,
                new { request.UserName });

            return new ForgotPasswordResponse
            {
                Success = false,
                Message = "You already have a pending reset request. Please wait for " +
                        "admin approval.",
            };
        }

        user.UserRequests.Add(new UserRequests
        {
            RequestType = "Reset Password",
            RequestStatus = "Pending",
            RequestDate = DateTime.UtcNow,
        });

        await logger.LogAuthenticationAsync(
            user.Id, 
            user.UserName, 
            "Reset Password Request (Pending Admin Approval)",
            true,
            new { request.UserName });

        await context.SaveChangesAsync();

        return new ForgotPasswordResponse
        {
            Success = true,
            Message = "Reset request submitted. Please wait for admin approval.",
        };
    }

    public async Task<ForgotPasswordResponse> UpdatePasswordAsync(
        ResetPasswordRequest request)
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

        var user = await context.Users.FirstOrDefaultAsync(u => u.UserName ==
                                                                request.UserName);
        if (user is null)
            return new ForgotPasswordResponse
            {
                Success = false,
                Message = "User not found."
            };

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        user.ForcePasswordChange = false;

        await logger.LogAuthenticationAsync(user.Id, user.UserName,
                                            "User Update Password Successfully",
                                            true, null);

        await context.SaveChangesAsync();
        return new ForgotPasswordResponse
        {
            Success = true,
            Message = "Password updated successfully.",
        };
    }

    public async Task<MyRequestStatusResponse?> GetMyRequestStatusAsync(
        int userId, string requestType)
    {
        var req =
            await context.UserRequests
                .Where(r => r.UserId == userId && r.RequestType == requestType)
                .OrderByDescending(r => r.RequestDate)
                .FirstOrDefaultAsync();

        if (req is null)
            return null;

        return new MyRequestStatusResponse
        {
            RequestType = req.RequestType,
            RequestStatus = req.RequestStatus,
            DecisionReason = req.DecisionReason,
            RequestDate = req.RequestDate,
            DecisionAtUtc = req.DecisionAtUtc,
        };
    }

    // ── Helpers
    // ───────────────────────────────────────────────────────────────

    private string GenerateToken(Users user, string refreshToken)
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

        var claims = new List<Claim> {
        new Claim(ClaimTypes.Name, user.UserName),
        new Claim(ClaimTypes.GivenName, user.Name),
        new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
        new Claim("ForcePasswordChange", user.ForcePasswordChange.ToString()),
        new Claim("rtv", TokenHashExtensions.ComputeTokenHash(refreshToken)),
      };

        if (user.Role != null && !string.IsNullOrWhiteSpace(user.Role.Name))
            claims.Add(new Claim(ClaimTypes.Role, user.Role.Name));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512);

        var token = new JwtSecurityToken(
            issuer: issuer, audience: audience, claims: claims,
            notBefore: DateTime.UtcNow,
            expires: DateTime.UtcNow.AddMinutes(15), // matches cookie expiry
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
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
}
