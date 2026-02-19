namespace backend.Models;

public class Users
{
    public int id { get; set; }
    public required string name { get; set; }
    public required string email { get; set; }
    public required string password { get; set; }
}
