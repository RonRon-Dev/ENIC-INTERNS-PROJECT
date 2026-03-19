using backend.Dtos.Request.Settings;
using backend.Dtos.Response.Settings;

namespace backend.Services.Interface;

public interface IAccountService
{
    Task<AccountResponse> UpdateAccountAsync(int Id, AccountRequest request);
}
