using backend.Dtos.Response.Dashboard;

namespace backend.Services.Interface;

public interface IActivityLogService
{
    Task<List<ActivityLogResponse>> GetActivityLogsAsync();
}
