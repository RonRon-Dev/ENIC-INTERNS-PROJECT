using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public class PagePrivilegesConfiguration : IEntityTypeConfiguration<PagePrivileges>
{
    public void Configure(EntityTypeBuilder<PagePrivileges> builder)
    {
        builder.HasKey(x => x.Id);

        builder.HasIndex(x => new { x.PageId, x.RoleId }).IsUnique();

        builder.HasOne(x => x.Page)
            .WithMany(p => p.PagePrivileges)
            .HasForeignKey(x => x.PageId);

        builder.HasOne(x => x.Role)
            .WithMany()
            .HasForeignKey(x => x.RoleId);
    }
}
