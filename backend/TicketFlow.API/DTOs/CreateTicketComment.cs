namespace TicketFlow.API.Dtos;

public class CreateTicketComment
{
    public string CommentText { get; set; } = string.Empty;

    public bool IsInternal { get; set; } = false;
}