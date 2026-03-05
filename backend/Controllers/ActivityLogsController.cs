using backend.Data;
using backend.Dtos.Response.ActivityLogs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[Route("api/activity-logs")]
[ApiController]
[Authorize(Roles = "Admin,Superadmin")]
public class ActivityLogsController(AppDbContext context) : ControllerBase
{
    // GET /api/activity-logs?take=200&search=&type=
    [HttpGet]
    public async Task<ActionResult<List<ActivityLogResponse>>> GetLogs(
        [FromQuery] int take = 200,
        [FromQuery] string? search = null,
        [FromQuery] string? type = null
    )
    {
        if (take <= 0) take = 50;
        if (take > 500) take = 500;

        var q = context.ActivityLogs
            .AsNoTracking()
            .Include(l => l.User)
            .ThenInclude(u => u!.Role)
            .OrderByDescending(l => l.Timestamp)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            q = q.Where(l =>
                l.UserName.ToLower().Contains(s) ||
                l.Description.ToLower().Contains(s) ||
                l.ActivityType.ToLower().Contains(s)
            );
        }

        var logs = await q.Take(take).ToListAsync();

        // Optional filter by normalized type (authentication/privilege/account management)
        if (!string.IsNullOrWhiteSpace(type))
        {
            var t = type.Trim().ToLower();
            logs = logs.Where(l => NormalizeType(l.ActivityType) == t).ToList();
        }

        var response = logs.Select(l =>
        {
            var user = l.User;

            var status =
                user == null ? "active" :
                !user.IsVerified ? "pending" :
                !user.IsActive ? "deactivated" :
                "active";

            var role = user?.Role?.Name?.Trim().ToLower() ?? "guest";

            return new ActivityLogResponse
            {
                Id = l.Id.ToString(),
                User = new ActivityLogUserResponse
                {
                    Id = (user?.Id ?? 0).ToString(),
                    Name = user?.Name ?? l.UserName,
                    Username = user?.UserName ?? l.UserName,
                    Status = status,
                    Role = role
                },
                Description = l.Description,
                Date = l.Timestamp.ToString("yyyy-MM-dd"),
                Time = l.Timestamp.ToString("HH:mm"),
                Type = NormalizeType(l.ActivityType)
            };
        }).ToList();

        return Ok(response);
    }

    private static string NormalizeType(string activityType) =>
        activityType.Trim().ToLower() switch
        {
            "authentication" => "authentication",
            "privilege" => "privilege",
            "account management" => "account management",
            _ => "privilege"
        };
}