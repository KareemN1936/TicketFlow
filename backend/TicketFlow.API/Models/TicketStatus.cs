namespace TicketFlow.API.Models;

public class TicketStatus
{
    public int Id { get; set; }

    public string StatusName { get; set; } = string.Empty;

    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
}