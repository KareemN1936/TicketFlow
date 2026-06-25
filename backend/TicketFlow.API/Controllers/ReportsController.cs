using System.Security.Claims;
using ClosedXML.Excel;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using TicketFlow.API.Data;
using TicketFlow.API.Dtos;
using TicketFlow.API.Helpers;
using TicketFlow.API.Models;

namespace TicketFlow.API.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    public ReportsController(ApplicationDbContext context) => _context = context;

    [HttpGet("summary")]
    public async Task<ActionResult<ReportSummaryResponse>> Summary(CancellationToken ct)
    {
        var tickets = await ScopedTickets().Include(x => x.TicketStatus).AsNoTracking().ToListAsync(ct);
        return Ok(BuildSummary(tickets));
    }

    [HttpGet("tickets-by-status")]
    public Task<List<ChartItemResponse>> ByStatus(CancellationToken ct) => Group(ScopedTickets(), x => x.TicketStatus!.StatusName, ct);

    [HttpGet("tickets-by-priority")]
    public Task<List<ChartItemResponse>> ByPriority(CancellationToken ct) => Group(ScopedTickets(), x => x.Priority!.PriorityName, ct);

    [HttpGet("tickets-by-category")]
    public Task<List<ChartItemResponse>> ByCategory(CancellationToken ct) => Group(ScopedTickets(), x => x.Category!.CategoryName, ct);

    [HttpGet("monthly")]
    public async Task<ActionResult<IEnumerable<MonthlyReportResponse>>> Monthly(CancellationToken ct)
    {
        var tickets = await ScopedTickets().Include(x => x.TicketStatus).AsNoTracking().ToListAsync(ct);
        return Ok(BuildMonthly(tickets));
    }

    [HttpGet("resolution-time")]
    public async Task<ActionResult<ResolutionTimeResponse>> ResolutionTime(CancellationToken ct)
    {
        var tickets = await ScopedTickets().Include(x => x.TicketStatus).AsNoTracking().ToListAsync(ct);
        var resolved = Completed(tickets).ToList();
        return Ok(new ResolutionTimeResponse { ResolvedTicketCount = resolved.Count, AverageHours = AverageResolutionHours(resolved) });
    }

    [HttpGet("agent-performance")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<IEnumerable<ReportAgentPerformanceResponse>>> AgentPerformance(CancellationToken ct) => Ok(await BuildAgentPerformance(ct));

    [HttpGet("employee-activity")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<IEnumerable<EmployeeActivityResponse>>> EmployeeActivity(CancellationToken ct)
    {
        var tickets = await ScopedTickets().Include(x => x.CreatedByUser).Include(x => x.TicketStatus).AsNoTracking().ToListAsync(ct);
        return Ok(tickets.GroupBy(x => new { x.CreatedByUserId, Name = x.CreatedByUser!.FullName })
            .Select(g => new EmployeeActivityResponse { EmployeeId = g.Key.CreatedByUserId, EmployeeName = g.Key.Name, CreatedTickets = g.Count(), ResolvedTickets = g.Count(IsCompleted), PendingTickets = g.Count(x => x.TicketStatus!.StatusName == "Pending") })
            .OrderByDescending(x => x.CreatedTickets));
    }

    [HttpGet("export/excel")]
    public async Task<IActionResult> ExportExcel(CancellationToken ct)
    {
        var data = await LoadExportData(ct);
        using var workbook = new XLWorkbook();
        AddSheet(workbook, "Summary", new[] { "Metric", "Value" }, SummaryRows(data.Summary));
        AddSheet(workbook, "Status", new[] { "Status", "Tickets" }, data.Status.Select(x => new object[] { x.Name, x.Count }));
        AddSheet(workbook, "Priority", new[] { "Priority", "Tickets" }, data.Priority.Select(x => new object[] { x.Name, x.Count }));
        AddSheet(workbook, "Category", new[] { "Category", "Tickets" }, data.Category.Select(x => new object[] { x.Name, x.Count }));
        AddSheet(workbook, "Monthly", new[] { "Month", "Created", "Resolved" }, data.Monthly.Select(x => new object[] { x.Month, x.Created, x.Resolved }));
        if (data.Agents.Count > 0) AddSheet(workbook, "Agent Performance", new[] { "Agent", "Assigned", "Resolved", "Open", "Average Resolution Hours" }, data.Agents.Select(x => new object[] { x.AgentName, x.AssignedTickets, x.ResolvedTickets, x.OpenTickets, x.AverageResolutionHours }));
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"ticketflow-report-{DateTime.UtcNow:yyyyMMdd-HHmm}.xlsx");
    }

    [HttpGet("export/pdf")]
    public async Task<IActionResult> ExportPdf(CancellationToken ct)
    {
        var data = await LoadExportData(ct);
        QuestPDF.Settings.License = LicenseType.Community;
        var generated = DateTime.UtcNow;
        var user = User.Identity?.Name ?? "Unknown user";
        var role = User.Claims.FirstOrDefault(x => x.Type == ClaimTypes.Role)?.Value ?? "Unknown role";
        var bytes = Document.Create(document => document.Page(page =>
        {
            page.Size(PageSizes.A4); page.Margin(28); page.DefaultTextStyle(x => x.FontSize(9));
            page.Header().Column(c => { c.Item().Text("TicketFlow Reports").Bold().FontSize(20).FontColor(Colors.Blue.Medium); c.Item().Text($"Generated {generated:u} | {user} | {role}").FontColor(Colors.Grey.Darken1); });
            page.Content().PaddingVertical(15).Column(c =>
            {
                c.Spacing(12);
                PdfTable(c.Item(), "Summary", new[] { "Metric", "Value" }, SummaryRows(data.Summary));
                PdfTable(c.Item(), "Tickets by Status", new[] { "Status", "Tickets" }, data.Status.Select(x => new object[] { x.Name, x.Count }));
                PdfTable(c.Item(), "Tickets by Priority", new[] { "Priority", "Tickets" }, data.Priority.Select(x => new object[] { x.Name, x.Count }));
                PdfTable(c.Item(), "Tickets by Category", new[] { "Category", "Tickets" }, data.Category.Select(x => new object[] { x.Name, x.Count }));
                PdfTable(c.Item(), "Monthly Trends", new[] { "Month", "Created", "Resolved" }, data.Monthly.Select(x => new object[] { x.Month, x.Created, x.Resolved }));
                if (data.Agents.Count > 0) PdfTable(c.Item(), "Agent Performance", new[] { "Agent", "Assigned", "Resolved", "Open", "Avg Hours" }, data.Agents.Select(x => new object[] { x.AgentName, x.AssignedTickets, x.ResolvedTickets, x.OpenTickets, x.AverageResolutionHours }));
            });
            page.Footer().AlignCenter().Text(x => { x.Span("Page "); x.CurrentPageNumber(); x.Span(" of "); x.TotalPages(); });
        })).GeneratePdf();
        return File(bytes, "application/pdf", $"ticketflow-report-{generated:yyyyMMdd-HHmm}.pdf");
    }

    private IQueryable<Ticket> ScopedTickets()
    {
        var query = _context.Tickets.AsQueryable();
        var id = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (User.IsInRole(RoleNames.Admin) || User.IsInRole(RoleNames.Manager)) return query;
        if (User.IsInRole(RoleNames.ITSupportAgent)) return query.Where(x => x.AssignedToUserId == id);
        if (User.IsInRole(RoleNames.Employee)) return query.Where(x => x.CreatedByUserId == id);
        return query.Where(_ => false);
    }

    private static async Task<List<ChartItemResponse>> Group(IQueryable<Ticket> query, System.Linq.Expressions.Expression<Func<Ticket, string>> key, CancellationToken ct) =>
        await query.GroupBy(key).Select(g => new ChartItemResponse { Name = g.Key, Count = g.Count() }).OrderByDescending(x => x.Count).ToListAsync(ct);

    private static bool IsCompleted(Ticket x) => x.TicketStatus?.StatusName is "Resolved" or "Closed";
    private static IEnumerable<Ticket> Completed(IEnumerable<Ticket> tickets) => tickets.Where(x => IsCompleted(x) && x.UpdatedAt.HasValue);
    // TODO: Add ResolvedAt/ClosedAt to Ticket and use it here. UpdatedAt is the available completion-time fallback.
    private static double AverageResolutionHours(IEnumerable<Ticket> tickets)
    {
        var hours = Completed(tickets).Select(x => (x.UpdatedAt!.Value - x.CreatedAt).TotalHours).Where(x => x >= 0).ToList();
        return hours.Count == 0 ? 0 : Math.Round(hours.Average(), 2);
    }

    private static ReportSummaryResponse BuildSummary(List<Ticket> tickets) => new()
    {
        TotalTickets = tickets.Count, OpenTickets = tickets.Count(x => x.TicketStatus?.StatusName == "Open"), InProgressTickets = tickets.Count(x => x.TicketStatus?.StatusName == "In Progress"), PendingTickets = tickets.Count(x => x.TicketStatus?.StatusName == "Pending"), ResolvedTickets = tickets.Count(x => x.TicketStatus?.StatusName == "Resolved"), ClosedTickets = tickets.Count(x => x.TicketStatus?.StatusName == "Closed"), AverageResolutionHours = AverageResolutionHours(tickets)
    };

    private static List<MonthlyReportResponse> BuildMonthly(List<Ticket> tickets)
    {
        var start = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1).AddMonths(-11);
        return Enumerable.Range(0, 12).Select(offset => start.AddMonths(offset)).Select(month => new MonthlyReportResponse
        {
            Month = month.ToString("MMM yyyy"), Created = tickets.Count(x => x.CreatedAt.Year == month.Year && x.CreatedAt.Month == month.Month), Resolved = tickets.Count(x => IsCompleted(x) && x.UpdatedAt?.Year == month.Year && x.UpdatedAt?.Month == month.Month)
        }).ToList();
    }

    private async Task<List<ReportAgentPerformanceResponse>> BuildAgentPerformance(CancellationToken ct)
    {
        var tickets = await ScopedTickets().Include(x => x.AssignedToUser).Include(x => x.TicketStatus).Where(x => x.AssignedToUserId != null).AsNoTracking().ToListAsync(ct);
        return tickets.GroupBy(x => new { Id = x.AssignedToUserId!, Name = x.AssignedToUser!.FullName }).Select(g => new ReportAgentPerformanceResponse { AgentId = g.Key.Id, AgentName = g.Key.Name, AssignedTickets = g.Count(), ResolvedTickets = g.Count(IsCompleted), OpenTickets = g.Count(x => !IsCompleted(x)), AverageResolutionHours = AverageResolutionHours(g) }).OrderByDescending(x => x.AssignedTickets).ToList();
    }

    private async Task<ExportData> LoadExportData(CancellationToken ct)
    {
        var tickets = await ScopedTickets().Include(x => x.TicketStatus).Include(x => x.Priority).Include(x => x.Category).AsNoTracking().ToListAsync(ct);
        var agents = User.IsInRole(RoleNames.Admin) || User.IsInRole(RoleNames.Manager) ? await BuildAgentPerformance(ct) : [];
        List<ChartItemResponse> GroupLocal(Func<Ticket, string> key) => tickets.GroupBy(key).Select(g => new ChartItemResponse { Name = g.Key, Count = g.Count() }).OrderByDescending(x => x.Count).ToList();
        return new(BuildSummary(tickets), GroupLocal(x => x.TicketStatus!.StatusName), GroupLocal(x => x.Priority!.PriorityName), GroupLocal(x => x.Category!.CategoryName), BuildMonthly(tickets), agents);
    }

    private static IEnumerable<object[]> SummaryRows(ReportSummaryResponse x) => new[] { new object[] { "Total", x.TotalTickets }, ["Open", x.OpenTickets], ["In Progress", x.InProgressTickets], ["Pending", x.PendingTickets], ["Resolved", x.ResolvedTickets], ["Closed", x.ClosedTickets], ["Average Resolution Hours", x.AverageResolutionHours] };
    private static void AddSheet(XLWorkbook book, string name, string[] headers, IEnumerable<object[]> rows)
    {
        var sheet = book.Worksheets.Add(name); for (var i = 0; i < headers.Length; i++) sheet.Cell(1, i + 1).Value = headers[i];
        sheet.Range(1, 1, 1, headers.Length).Style.Font.Bold = true; var row = 2;
        foreach (var values in rows) { for (var i = 0; i < values.Length; i++) sheet.Cell(row, i + 1).Value = XLCellValue.FromObject(values[i]); row++; }
        sheet.Columns().AdjustToContents(); sheet.SheetView.FreezeRows(1);
    }

    private static void PdfTable(IContainer container, string title, string[] headers, IEnumerable<object[]> rows)
    {
        container.Column(c => { c.Item().Text(title).Bold().FontSize(12); c.Item().Table(t => { t.ColumnsDefinition(x => { foreach (var _ in headers) x.RelativeColumn(); }); t.Header(h => { foreach (var text in headers) h.Cell().Background(Colors.Blue.Lighten4).Padding(4).Text(text).Bold(); }); foreach (var row in rows) foreach (var value in row) t.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(4).Text(value?.ToString() ?? ""); }); });
    }

    private record ExportData(ReportSummaryResponse Summary, List<ChartItemResponse> Status, List<ChartItemResponse> Priority, List<ChartItemResponse> Category, List<MonthlyReportResponse> Monthly, List<ReportAgentPerformanceResponse> Agents);
}
