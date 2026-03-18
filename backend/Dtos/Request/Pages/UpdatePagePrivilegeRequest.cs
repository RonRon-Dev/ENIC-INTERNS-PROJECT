using System.ComponentModel.DataAnnotations;

namespace backend.Dtos.Request.Pages;

public class UpdatePagePrivilegeRequest
{
    [Required]
    public string Url { get; set; } = string.Empty;

    public List<int> RoleIds { get; set; } = [];
}
