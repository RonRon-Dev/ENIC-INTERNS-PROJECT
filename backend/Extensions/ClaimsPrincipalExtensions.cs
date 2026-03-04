using System.Security.Claims;

namespace backend.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static int GetCurrentUser(this ClaimsPrincipal user)
    {
        if(user is null)
            return 0;

        return int.Parse(user.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value ?? "0");

    }
}
