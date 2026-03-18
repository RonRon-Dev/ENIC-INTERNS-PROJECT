namespace backend.Models;

public class Pages
{
    public int Id { get; set; }
    public string Url { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public bool IsUnderMaintenance { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public ICollection<PagePrivileges> PagePrivileges { get; set; } = new List<PagePrivileges>();
}
