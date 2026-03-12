using System.Text.Json;
using backend.Dtos.Response.Dashboard;
using backend.Models;

namespace backend.Extensions;

public static class ActivityLogExtensions
{
    public static ActivityLogResponse ToResponse(this ActivityLogs log)
    {

        var user = log.User ?? throw new InvalidOperationException(
            $"ActivityLog {log.Id} must be loaded with User navigation property.");
        return new ActivityLogResponse
        {
            Id = log.Id.ToString(),
            User =
              new ActivityLogUserResponse
              {
                  Id = user.Id.ToString(),
                  Name = user.Name,
                  Username = user.UserName,
                  Status =
                    user.IsVerified
                        ? (user.IsActive ? "active" : "deactivated")
                        : "pending",
                  Role = user.Role?.Name.ToLower() ?? "guest"
              },
            Description = log.Description,
            Date = log.Timestamp.ToString("yyyy-MM-dd"),
            Time = log.Timestamp.ToString("HH:mm"),
            Type = NormalizeType(log.ActivityType),
            Success = log.IsSuccess,
            Payload = log.Payload.ParseJsonPayload()
        };
    }

    private static object? ParseJsonPayload(this string? payloadJson)
    {
        if (string.IsNullOrEmpty(payloadJson))
            return null;
        try
        {
            return JsonSerializer.Deserialize<object>(payloadJson);
        }
        catch (JsonException)
        {
            return payloadJson;
        }
    }

    private static string NormalizeType(string activityType) =>
        activityType.Trim().ToLower() switch
        {
            "authentication" => "authentication",
            "privilege" => "privilege",
            "account management" => "account management",
            "settings" => "settings",
            _ => "privilege"
        };
}
