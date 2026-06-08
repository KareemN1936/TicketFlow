using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using TicketFlow.API.Models;

namespace TicketFlow.API.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Ticket> Tickets { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<Priority> Priorities { get; set; }
    public DbSet<TicketStatus> TicketStatuses { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Category>().HasData(
            new Category { Id = 1, CategoryName = "Hardware" },
            new Category { Id = 2, CategoryName = "Software" },
            new Category { Id = 3, CategoryName = "Network" },
            new Category { Id = 4, CategoryName = "Email" },
            new Category { Id = 5, CategoryName = "Access Request" },
            new Category { Id = 6, CategoryName = "Other" }
        );

        builder.Entity<Priority>().HasData(
            new Priority { Id = 1, PriorityName = "Low" },
            new Priority { Id = 2, PriorityName = "Medium" },
            new Priority { Id = 3, PriorityName = "High" },
            new Priority { Id = 4, PriorityName = "Critical" }
        );

        builder.Entity<TicketStatus>().HasData(
            new TicketStatus { Id = 1, StatusName = "Open" },
            new TicketStatus { Id = 2, StatusName = "In Progress" },
            new TicketStatus { Id = 3, StatusName = "Pending" },
            new TicketStatus { Id = 4, StatusName = "Resolved" },
            new TicketStatus { Id = 5, StatusName = "Closed" }
        );

        builder.Entity<Ticket>()
            .HasOne(t => t.CreatedByUser)
            .WithMany()
            .HasForeignKey(t => t.CreatedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Ticket>()
            .HasOne(t => t.Category)
            .WithMany(c => c.Tickets)
            .HasForeignKey(t => t.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Ticket>()
            .HasOne(t => t.Priority)
            .WithMany(p => p.Tickets)
            .HasForeignKey(t => t.PriorityId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Ticket>()
            .HasOne(t => t.TicketStatus)
            .WithMany(s => s.Tickets)
            .HasForeignKey(t => t.TicketStatusId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}