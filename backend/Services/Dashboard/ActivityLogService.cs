using backend.Extensions;
using backend.Data;
using backend.Dtos.Response.Dashboard;
using backend.Services.Interface;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.Dashboard;

public class ActivityLogService(AppDbContext context) : IActivityLogService
{
    public async Task<List<ActivityLogResponse>> GetActivityLogsAsync()
    {
        var q = context.ActivityLogs
            .AsNoTracking()
            .Include(l => l.User)
            .ThenInclude(u => u!.Role)
            .OrderByDescending(l => l.Timestamp)
            .AsQueryable();

        var logs = await q.ToListAsync();

        return logs.Select(log => log.ToResponse()).ToList();
    }

}

