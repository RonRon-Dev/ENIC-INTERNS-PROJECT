using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using backend.Models;

public class ActivityLogConfiguration : IEntityTypeConfiguration<ActivityLogs>
{
    public void Configure(EntityTypeBuilder<ActivityLogs> builder)
    {
        builder.HasKey(al => al.id);

        builder.Property(al => al.userName)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(al => al.activityType)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(al => al.timestamp)
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        builder.HasOne(al => al.user)
            .WithMany(u => u.activityLogs)
            .HasForeignKey(al => al.userId);
    }
}
