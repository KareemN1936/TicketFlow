namespace TicketFlow.API.Dtos;

public class TicketResponse
{
    public int Id { get; set; }

    public string ReferenceNumber { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string CreatedByUserId { get; set; } = string.Empty;

    public string CreatedByUserName { get; set; } = string.Empty;

    public int CategoryId { get; set; }

    public string CategoryName { get; set; } = string.Empty;

    public int PriorityId { get; set; }

    public string PriorityName { get; set; } = string.Empty;

    public int TicketStatusId { get; set; }

    public string StatusName { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }
    
    public string? AssignedToUserId { get; set; }

    public string AssignedToUserName { get; set; } = string.Empty;

    public List<TicketCommentResponse> Comments { get; set; } = new();

    public List<ActivityLogResponse> ActivityLogs { get; set; } = new();
}