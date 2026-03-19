using System.ComponentModel.DataAnnotations;

namespace backend.Dtos.Request.User;

public class RejectUserRequestRequest
{
    [Required]
    public int RequestId { get; set; }

    [Required]
    public string Reason { get; set; } = string.Empty;
}
