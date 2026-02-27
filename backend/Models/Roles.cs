namespace backend.Models;

public class Roles
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    //Navigation property to Users
    public ICollection<Users> Users { get; set; } = new List<Users>();
}
