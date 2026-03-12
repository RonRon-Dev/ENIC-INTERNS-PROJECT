namespace backend.Models;

public class PagePrivileges
{
    public int Id { get; set; }

    public int PageId { get; set; }
    public Pages Page { get; set; } = null!;

    public int RoleId { get; set; }
    public Roles Role { get; set; } = null!;
}
