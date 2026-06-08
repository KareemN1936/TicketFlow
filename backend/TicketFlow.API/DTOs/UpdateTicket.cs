using System.ComponentModel.DataAnnotations;

namespace TicketFlow.API.Dtos;

public class UpdateTicket
{
    [Required]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string Description { get; set; } = string.Empty;

    [Required]
    public int CategoryId { get; set; }

    [Required]
    public int PriorityId { get; set; }

    [Required]
    public int TicketStatusId { get; set; }
}