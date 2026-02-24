using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using backend.Models;

public class RoleConfiguration : IEntityTypeConfiguration<Roles>
{
    public void Configure(EntityTypeBuilder<Roles> builder)
    {
        builder.HasKey(r => r.id);

        builder.HasMany(r => r.users)
            .WithOne(u => u.role)
            .HasForeignKey(u => u.roleId);
    }
}
