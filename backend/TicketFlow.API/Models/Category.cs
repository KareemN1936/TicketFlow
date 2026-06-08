namespace TicketFlow.API.Models;

public class Category
{
    public int Id { get; set; }

    public string CategoryName { get; set; } = string.Empty;

    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
}