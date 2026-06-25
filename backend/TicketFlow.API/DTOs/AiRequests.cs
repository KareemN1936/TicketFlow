using System.ComponentModel.DataAnnotations;

namespace TicketFlow.API.Dtos;

public class AiTicketTextRequest
{
    [Required, StringLength(200)] public string Title { get; set; } = string.Empty;
    [Required, StringLength(10000)] public string Description { get; set; } = string.Empty;
}

public class AiTicketRequest : AiTicketTextRequest
{
    public int? TicketId { get; set; }
    [StringLength(100)] public string? Status { get; set; }
    [StringLength(100)] public string? Priority { get; set; }
    [StringLength(100)] public string? Category { get; set; }
    public List<string> Comments { get; set; } = [];
}

public class AiChatRequest
{
    [Required, StringLength(4000)] public string Message { get; set; } = string.Empty;
}

public class AiSuggestionResponse
{
    public int? SuggestedId { get; set; }
    public string SuggestedName { get; set; } = string.Empty;
    public double Confidence { get; set; }
    public string Reason { get; set; } = string.Empty;
    public bool IsConfigured { get; set; } = true;
}

public class AiTextResponse
{
    public string Content { get; set; } = string.Empty;
    public bool IsConfigured { get; set; } = true;
}
