namespace TicketFlow.API.Dtos;

public class DashboardSummaryResponse
{
    public int TotalTickets { get; set; }
    public int OpenTickets { get; set; }
    public int InProgressTickets { get; set; }
    public int PendingTickets { get; set; }
    public int ResolvedTickets { get; set; }
    public int ClosedTickets { get; set; }
    public int HighPriorityTickets { get; set; }
    public int CriticalPriorityTickets { get; set; }
    public int UnassignedTickets { get; set; }
    public int MyAssignedTickets { get; set; }
}

public class ChartItemResponse
{
    public string Name { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class AgentPerformanceResponse
{
    public string AgentId { get; set; } = string.Empty;
    public string AgentName { get; set; } = string.Empty;
    public int AssignedTickets { get; set; }
    public int ResolvedTickets { get; set; }
    public int OpenTickets { get; set; }
}

public class RecentActivityResponse
{
    public int Id { get; set; }
    public string Action { get; set; } = string.Empty;
    public int? TicketId { get; set; }
    public string TicketReferenceNumber { get; set; } = string.Empty;
    public string PerformedBy { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}