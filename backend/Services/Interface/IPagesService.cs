using backend.Dtos.Request.Pages;
using backend.Dtos.Response.Pages;

namespace backend.Services.Interface;

public interface IPagesService
{
    Task<List<PagePrivilegeResponse>> GetPagesAsync();

    Task<String> UpdatePagesAsync(UpdatePagePrivilegeRequest request);
}
