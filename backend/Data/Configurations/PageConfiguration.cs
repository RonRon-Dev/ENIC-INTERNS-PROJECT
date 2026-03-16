using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public class PageConfiguration : IEntityTypeConfiguration<Pages>
{
    public void Configure(EntityTypeBuilder<Pages> builder)
    {
        builder.HasKey(p => p.Id);

        builder.Property(p => p.Url).IsRequired().HasMaxLength(200);
        builder.HasIndex(p => p.Url).IsUnique();

        builder.Property(p => p.Title).IsRequired().HasMaxLength(200);
        builder.Property(p => p.IsUnderMaintenance).HasDefaultValue(false);
    }
}
