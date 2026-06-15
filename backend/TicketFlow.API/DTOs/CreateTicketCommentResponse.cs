namespace TicketFlow.API.Dtos;

public class TicketCommentResponse
{
    public int Id { get; set; }

    public int TicketId { get; set; }

    public string UserId { get; set; } = string.Empty;

    public string UserName { get; set; } = string.Empty;

    public string CommentText { get; set; } = string.Empty;

    public bool IsInternal { get; set; }

    public DateTime CreatedAt { get; set; }
}