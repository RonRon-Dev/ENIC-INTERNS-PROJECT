using System.Security.Claims;
using System.Text;
using backend.Data;
using backend.Services.ActivityLogger;
using backend.Services.Auth;
using backend.Services.Dashboard;
using backend.Services.Interface;
using backend.Services.User;
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

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "AllowReact",
        policy =>
        {
            policy
                .WithOrigins("http://localhost:5173", "http://127.14.0.8:5173")
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
            ClockSkew = TimeSpan.FromMinutes(2), // ✅ tolerate small time drift

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

// Swagger (Authorize button)
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
builder.Services.AddScoped<ActivityLoggerService>();

var app = builder.Build();

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
