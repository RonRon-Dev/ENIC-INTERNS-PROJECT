using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using backend.Models;

public class ActivityLogConfiguration : IEntityTypeConfiguration<ActivityLogs>
{
    public void Configure(EntityTypeBuilder<ActivityLogs> builder)
    {
        builder.HasKey(al => al.Id);

        builder.Property(al => al.UserName)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(al => al.ActivityType)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(al => al.Timestamp)
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        builder.HasOne(al => al.User)
            .WithMany(u => u.ActivityLogs)
            .HasForeignKey(al => al.UserId);
    }
}
