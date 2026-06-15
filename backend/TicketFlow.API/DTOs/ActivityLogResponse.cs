namespace TicketFlow.API.Dtos;

public class ActivityLogResponse
{
    public int Id { get; set; }

    public int TicketId { get; set; }

    public string UserId { get; set; } = string.Empty;

    public string UserName { get; set; } = string.Empty;

    public string Action { get; set; } = string.Empty;

    public string? OldValue { get; set; }

    public string? NewValue { get; set; }

    public DateTime CreatedAt { get; set; }
}