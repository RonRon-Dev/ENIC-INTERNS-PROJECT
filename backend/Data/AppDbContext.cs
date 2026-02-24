using Microsoft.EntityFrameworkCore;
using backend.Models;
using System.Reflection;

namespace backend.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
  public DbSet<Users> Users => Set<Users>(); 
  public DbSet<Roles> Roles => Set<Roles>();
  public DbSet<ActivityLogs> ActivityLogs => Set<ActivityLogs>();

  protected override void OnModelCreating(ModelBuilder modelBuilder)
  {
    base.OnModelCreating(modelBuilder);
    
    modelBuilder.ApplyConfigurationsFromAssembly(
        Assembly.GetExecutingAssembly()
    );
  }
}
