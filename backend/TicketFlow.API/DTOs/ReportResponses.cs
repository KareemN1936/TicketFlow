namespace TicketFlow.API.Dtos;

public class ReportSummaryResponse
{
    public int TotalTickets { get; set; }
    public int OpenTickets { get; set; }
    public int InProgressTickets { get; set; }
    public int PendingTickets { get; set; }
    public int ResolvedTickets { get; set; }
    public int ClosedTickets { get; set; }
    public double AverageResolutionHours { get; set; }
}

public class MonthlyReportResponse
{
    public string Month { get; set; } = string.Empty;
    public int Created { get; set; }
    public int Resolved { get; set; }
}

public class ReportAgentPerformanceResponse : AgentPerformanceResponse
{
    public double AverageResolutionHours { get; set; }
}

public class EmployeeActivityResponse
{
    public string EmployeeId { get; set; } = string.Empty;
    public string EmployeeName { get; set; } = string.Empty;
    public int CreatedTickets { get; set; }
    public int ResolvedTickets { get; set; }
    public int PendingTickets { get; set; }
}

public class ResolutionTimeResponse
{
    public double AverageHours { get; set; }
    public int ResolvedTicketCount { get; set; }
}
