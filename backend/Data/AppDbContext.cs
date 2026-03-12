using Microsoft.EntityFrameworkCore;
using backend.Models;
using System.Reflection;

namespace backend.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
  public DbSet<Users> Users => Set<Users>(); 
  public DbSet<Roles> Roles => Set<Roles>();
  public DbSet<UserRequests> UserRequests => Set<UserRequests>();
  public DbSet<ActivityLogs> ActivityLogs => Set<ActivityLogs>();
  public DbSet<Pages> Pages => Set<Pages>();
  public DbSet<PagePrivileges> PagePrivileges => Set<PagePrivileges>();

  protected override void OnModelCreating(ModelBuilder modelBuilder)
  {
    base.OnModelCreating(modelBuilder);
    
    modelBuilder.ApplyConfigurationsFromAssembly(
        Assembly.GetExecutingAssembly()
    );
  }
}
