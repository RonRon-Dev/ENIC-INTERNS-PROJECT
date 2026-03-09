using backend.Dtos.Response.Dashboard;
using backend.Services.Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers.Dashboard;

[Route("api/activity-logs")]
[ApiController]
[Authorize(Roles = "Admin,Superadmin")]
public class ActivityLogsController(IActivityLogService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<ActivityLogResponse>>> GetActivityLogs() =>
        Ok(await service.GetActivityLogsAsync());
}
