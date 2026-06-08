namespace TicketFlow.API.Models;

public class Priority
{
    public int Id { get; set; }

    public string PriorityName { get; set; } = string.Empty;

    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
}