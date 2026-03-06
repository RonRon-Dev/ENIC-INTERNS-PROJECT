using backend.Models;
using backend.Data;

namespace backend.Services.ActivityLogger;

public class ActivityLoggerService
{ 
    private readonly AppDbContext context;
    private readonly IHttpContextAccessor http;
    private static DateTime PhTime => DateTime.UtcNow.AddHours(8);

    public ActivityLoggerService(AppDbContext _context, IHttpContextAccessor httpContextAccessor)
    {
        context = _context;
        http = httpContextAccessor;
    }

    public async Task LogAuthenticationAsync(
        int? userId,
        string userName,
        string description,
        bool isSuccess,
        object? additionalData = null
    )
    {
        var payload = BuildPayload(additionalData);

        await LogAsync("authentication", userId, userName, description, isSuccess, payload);
    }

    public async Task LogPrivilegeChangeAsync(
        int? userId,
        string userName,
        string description,
        bool isSuccess,
        object? additionalData = null
    )
    {
        var payload = BuildPayload(additionalData);

        await LogAsync("privilege", userId, userName, description, isSuccess, payload);
    }

    public async Task LogAccountManagementAsync(
        int? userId,
        string userName,
        string description,
        bool isSuccess,
        object? additionalData = null
    )
    {
        var payload = BuildPayload(additionalData);
        await LogAsync("account management", userId, userName, description, isSuccess, payload);
    }

    private object BuildPayload(
        object? additionalData
    )
    {
        return new
        {
            UserAgent = GetUserAgent(),
            IpAddress = GetClientIpAddress(),
            AdditionalData = additionalData,
        };
    }

    private async Task LogAsync(
        string activityType,
        int? userId,
        string userName,
        string description,
        bool isSuccess,
        object payload
    )
    {
        context.ActivityLogs.Add(
            new ActivityLogs
            {
                UserId = userId ?? 0,
                UserName = userName,
                ActivityType = activityType,
                Description = description,
                Payload = System.Text.Json.JsonSerializer.Serialize(payload),
                IsSuccess = isSuccess,
                Timestamp = PhTime,
            }
        );

        await context.SaveChangesAsync();
    }

    private string GetClientIpAddress()
    {
        var httpContext = http.HttpContext;
        var forwardedFor = httpContext?.Request.Headers["X-Forwarded-For"].FirstOrDefault();

        if (!string.IsNullOrEmpty(forwardedFor))
            return forwardedFor.Split(',')[0].Trim();

        return httpContext?.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
    } 

    private string GetUserAgent()
    {
        try
        {
            var httpContext = http.HttpContext;
            return httpContext?.Request.Headers["User-Agent"].ToString() ?? "Unknown";
        }
        catch
        {
            return "Unknown";
        }
    }
}
