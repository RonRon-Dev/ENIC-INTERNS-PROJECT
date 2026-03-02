using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using backend.Models;

public class UserRequestConfiguration : IEntityTypeConfiguration<UserRequests>
{
    public void Configure(EntityTypeBuilder<UserRequests> builder)
    {
        builder.HasKey(ur => ur.Id);

        builder.Property(ur => ur.RequestType)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(ur => ur.RequestStatus)
            .IsRequired()
            .HasMaxLength(50)
            .HasDefaultValue("Pending");

        builder.Property(ur => ur.RequestDate)
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        builder.HasOne(ur => ur.User)
            .WithMany(u => u.UserRequests)
            .HasForeignKey(ur => ur.UserId);
    }
}
