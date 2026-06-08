namespace TicketFlow.API.Models;

public class Ticket
{
    public int Id { get; set; }

    public string ReferenceNumber { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string CreatedByUserId { get; set; } = string.Empty;

    public ApplicationUser? CreatedByUser { get; set; }

    public int CategoryId { get; set; }

    public Category? Category { get; set; }

    public int PriorityId { get; set; }

    public Priority? Priority { get; set; }

    public int TicketStatusId { get; set; }

    public TicketStatus? TicketStatus { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }
}