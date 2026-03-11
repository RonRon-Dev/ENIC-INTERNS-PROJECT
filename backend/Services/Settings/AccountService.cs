using backend.Data;
using backend.Dtos.Request.Settings;
using backend.Dtos.Response.Settings;
using backend.Services.ActivityLogger;
using backend.Services.Interface;
using BCrypt.Net;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.Settings;

public class AccountService(AppDbContext context, ActivityLoggerService logger) : IAccountService
{
    private void TrackChange<T>(
        bool changed,
        string field,
        T oldValue,
        T newValue,
        List<string> updated,
        Dictionary<string, object> oldVals,
        Dictionary<string, object> newVals
    )
    {
        if (!changed)
            return;

        updated.Add(field);
        oldVals[field] = oldValue!;
        newVals[field] = newValue!;
    }

    public async Task<AccountResponse> UpdateAccountAsync(int Id, AccountRequest request)
    {
        var user = await context.Users.FirstOrDefaultAsync(u => u.Id == Id);

        if (user is null)
            throw new Exception("User not found");

        var updatedFields = new List<string>();
        var oldValues = new Dictionary<string, object>();
        var newValues = new Dictionary<string, object>();

        var oldUserName = user.UserName;
        var oldName = user.Name;

        var passwordChanged =
            !string.IsNullOrEmpty(request.Password)
            && !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);

        var nameChanged =
            !string.IsNullOrWhiteSpace(request?.Name)
            && !string.Equals(request.Name, user?.Name, StringComparison.Ordinal);

        var userNameChanged =
            !string.IsNullOrWhiteSpace(request?.UserName)
            && !string.Equals(request.UserName, user?.UserName, StringComparison.Ordinal);

        if (nameChanged)
            user.Name = request?.Name;

        if (userNameChanged)
            user.UserName = request?.UserName;

        TrackChange(nameChanged, "Name", oldName, user.Name, updatedFields, oldValues, newValues);
        TrackChange(
            userNameChanged,
            "UserName",
            oldUserName,
            user.UserName,
            updatedFields,
            oldValues,
            newValues
        );

        if (passwordChanged)
        {
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
            updatedFields.Add("Password");
        }

        context.Users.Update(user);
        await context.SaveChangesAsync();

        var payload = new
        {
            UpdatedFields = updatedFields,
            OldValues = oldValues,
            NewValues = newValues,
        };

        await logger.LogSettingsAsync(
            user.Id,
            user.UserName,
            $"Updated account profile for {user.Name}",
            true,
            payload
        );

        return new AccountResponse
        {
            Name = user.Name,
            Success = true,
            Message = $"Account updated for {user.UserName} successfully.",
        };
    }
}
