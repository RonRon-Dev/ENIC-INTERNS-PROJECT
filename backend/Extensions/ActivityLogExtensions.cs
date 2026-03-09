using System.Text.Json;
using backend.Dtos.Response.Dashboard;
using backend.Models;

namespace backend.Extensions;

public static class ActivityLogExtensions
{
    public static ActivityLogResponse ToResponse(this ActivityLogs log)
    {
        return new ActivityLogResponse
        {
            Id = log.Id.ToString(),
            User =
              new ActivityLogUserResponse
              {
                  Id = log.User.Id.ToString(),
                  Name = log.User.Name,
                  Username = log.User.UserName,
                  Status =
                    log.User.IsVerified
                        ? (log.User.IsActive ? "active" : "deactivated")
                        : "pending",
                  Role = log.User.Role.Name ?? "",
              },
            Description = log.Description,
            Date = log.Timestamp.ToString("yyyy-MM-dd"),
            Time = log.Timestamp.ToString("HH:mm"),
            Type = NormalizeType(log.ActivityType),
            Success = log.IsSuccess ? "success" : "failure",
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
