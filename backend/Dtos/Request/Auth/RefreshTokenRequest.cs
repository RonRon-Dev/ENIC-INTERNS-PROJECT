using System.ComponentModel.DataAnnotations;
namespace backend.Dtos.Request.Auth;

public class RefreshTokenRequest
{
    public int UserId { get; set; }
    public required string RefreshToken { get; set; }
}


