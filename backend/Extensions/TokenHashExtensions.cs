using System.Security.Cryptography;
using System.Text;

namespace backend.Extensions;

public static class TokenHashExtensions
{
    public static string ComputeTokenHash(string token)
    {
        var bytes = Encoding.UTF8.GetBytes(token);
        var hash = SHA256.HashData(bytes);
        return Convert.ToHexString(hash);
    }
}
