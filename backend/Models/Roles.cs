namespace backend.Models;

public class Roles
{
    public int id { get; set; }
    public string name { get; set; } = string.Empty;

    //Navigation property to Users
    public ICollection<Users> users { get; set; } = new List<Users>();
}
