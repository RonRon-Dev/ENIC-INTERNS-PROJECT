using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using backend.Models;

public class UserConfiguration : IEntityTypeConfiguration<Users>
{
    public void Configure(EntityTypeBuilder<Users> builder)
    {
        builder.HasKey(u => u.id);

        builder.HasOne(u => u.role)
            .WithMany(r => r.users)
            .HasForeignKey(u => u.roleId);

        builder.HasMany(u => u.activityLogs)
            .WithOne(al => al.user)
            .HasForeignKey(al => al.userId);
    }
}
