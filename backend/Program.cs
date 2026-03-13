using System.Security.Claims;
using System.Text;
using backend.Data;
using backend.Extensions;
using backend.Services.ActivityLogger;
using backend.Services.Auth;
using backend.Services.Dashboard;
using backend.Services.Interface;
using backend.Services.User;
using backend.Services.Settings;
using Microsoft.AspNetCore.Authentication.JwtBearer;
// using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

// EF Core
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"))
);

// CORS — origins loaded from config, not hardcoded
var allowedOrigins = builder.Configuration
    .GetSection("AllowedOrigins")
    .Get<string[]>() ?? ["http://localhost:5173"];

builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "AllowReact",
        policy =>
        {
            policy
                .WithOrigins(allowedOrigins)
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        }
    );
});

var issuer = builder.Configuration["AppSettings:Issuer"];
var audience = builder.Configuration["AppSettings:Audience"];
var secret = builder.Configuration["AppSettings:Token"];

if (string.IsNullOrWhiteSpace(issuer))
    throw new InvalidOperationException("AppSettings:Issuer is missing.");
if (string.IsNullOrWhiteSpace(audience))
    throw new InvalidOperationException("AppSettings:Audience is missing.");
if (string.IsNullOrWhiteSpace(secret))
    throw new InvalidOperationException("AppSettings:Token is missing.");

// JWT Auth
builder
    .Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // helps when debugging invalid_token
        options.IncludeErrorDetails = true;

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = issuer,

            ValidateAudience = true,
            ValidAudience = audience,

            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(2),

            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
        };

        // log WHY it fails (look at your terminal output)
        options.Events = new JwtBearerEvents
        {
            // READ token from HttpOnly cookie
            OnMessageReceived = context =>
            {
                var token = context.Request.Cookies["accessToken"];
                if (!string.IsNullOrEmpty(token))
                {
                    context.Token = token;
                }
                return Task.CompletedTask;
            },

            OnTokenValidated = async context =>
            {
                var userIdStr = context.Principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(userIdStr, out var userId))
                {
                    context.Fail("Invalid user id.");
                    return;
                }

                var db = context.HttpContext.RequestServices.GetRequiredService<AppDbContext>();

                var user = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
                if (user is null)
                {
                    context.Fail("User not found.");
                    return;
                }

                // block disabled accounts
                if (!user.IsActive)
                {
                    context.Fail("Account disabled.");
                    return;
                }

                // also enforce approval
                if (!user.IsVerified)
                {
                    context.Fail("Pending approval.");
                    return;
                }

                // single-session enforcement: access token must match current refresh token fingerprint
                var tokenVersion = context.Principal?.FindFirst("rtv")?.Value;
                if (string.IsNullOrWhiteSpace(tokenVersion) || string.IsNullOrWhiteSpace(user.RefreshToken))
                {
                    context.Fail("Session invalidated.");
                    return;
                }

                var currentVersion = TokenHashExtensions.ComputeTokenHash(user.RefreshToken);
                if (!string.Equals(tokenVersion, currentVersion, StringComparison.Ordinal))
                {
                    context.Fail("SESSION_REPLACED");
                    return;
                }
            },

            OnAuthenticationFailed = context =>
            {
                Console.WriteLine("JWT AUTH FAILED: " + context.Exception.Message);
                return Task.CompletedTask;
            },

            OnChallenge = context =>
            {
                Console.WriteLine(
                    "JWT CHALLENGE: " + context.Error + " | " + context.ErrorDescription
                );

                if (!context.Response.HasStarted)
                {
                    context.HandleResponse();
                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    context.Response.ContentType = "application/json";

                    var rawMessage = context.AuthenticateFailure?.Message ?? "Unauthorized";
                    var message = rawMessage == "SESSION_REPLACED"
                        ? "Your account was signed in on another device. This session has been logged out."
                        : "Your session is no longer valid. Please sign in again.";

                    return context.Response.WriteAsync($"{{\"message\":\"{message}\"}}");
                }

                return Task.CompletedTask;
            },
        };
    });

/* builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.ExpireTimeSpan = TimeSpan.FromMinutes(30);
        options.SlidingExpiration = true;
        options.Cookie.HttpOnly = true;
    }); */

builder.Services.AddAuthorization();

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "ENIC Interns API", Version = "v1" });

    c.AddSecurityDefinition(
        "Bearer",
        new OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            In = ParameterLocation.Header,
            Description = "Enter: Bearer {your JWT token}",
        }
    );

    c.AddSecurityRequirement(
        new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference
                    {
                        Type = ReferenceType.SecurityScheme,
                        Id = "Bearer",
                    },
                },
                Array.Empty<string>()
            },
        }
    );
});

// DI
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IActivityLogService, ActivityLogService>();
builder.Services.AddScoped<IAccountService, AccountService>();
builder.Services.AddScoped<ActivityLoggerService>();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
    await DatabaseSeeder.SeedAsync(db);

}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();

    app.MapScalarApiReference(options =>
    {
        options.OpenApiRoutePattern = "/swagger/v1/swagger.json";
    });

    using var scope = app.Services.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await DatabaseSeeder.SeedAsync(context);
}

app.UseHttpsRedirection();
app.UseCors("AllowReact");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.Run();
