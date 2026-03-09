using backend.Services.ActivityLogger;
using backend.Services.Interface;
using backend.Data;
using backend.Dtos.Response.Settings;
using backend.Dtos.Request.Settings;
using Microsoft.EntityFrameworkCore;
using BCrypt.Net;

namespace backend.Services.Settings;

public class AccountService(
    AppDbContext context,
    ActivityLoggerService logger) : IAccountService
{
    public async Task<AccountResponse> UpdateAccountAsync(int Id, AccountRequest request)
    {
        var user = await context.Users
            .FirstOrDefaultAsync(u => u.Id == Id);

        if (user is null)
            throw new Exception("User not found");

        user.Name = request.Name == user.Name ? user.Name : request.Name;
        user.UserName = request.UserName == user.UserName ? user.UserName : request.UserName;

        var updatePasswword = !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash) && !string.IsNullOrEmpty(request.Password);

        if (updatePasswword)
        {
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
        }

        context.Users.Update(user);
        await context.SaveChangesAsync();

        var payload = new
        {
              UpdatedFields = new List<string>
              {
                  request.Name != user.Name ? "Name" : null,
                  request.UserName != user.UserName ? "UserName" : null,
                  updatePasswword ? "Password" : null
              }.Where(f => f != null).ToList()
        };

        await logger.LogSettingsAsync(
            user.Id,
            user.UserName,
            $"Updated account settings for {user.Name}",
            true,
            payload
        );

        return new AccountResponse
        {
            Name = user.Name,
            Success = true,
            Message = $"Account updated for {user.UserName} successfully."
        };
    }
}
