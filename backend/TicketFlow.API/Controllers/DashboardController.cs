using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TicketFlow.API.Data;
using TicketFlow.API.Dtos;
using TicketFlow.API.Models;

namespace TicketFlow.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public DashboardController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("summary")]
    public async Task<ActionResult<DashboardSummaryResponse>> GetSummary()
    {
        var ticketsQuery = GetRoleBasedTicketsQuery();
        var currentUserId = GetCurrentUserId();

        var summary = new DashboardSummaryResponse
        {
            TotalTickets = await ticketsQuery.CountAsync(),

            OpenTickets = await ticketsQuery.CountAsync(t =>
                t.TicketStatus != null &&
                t.TicketStatus.StatusName == "Open"),

            InProgressTickets = await ticketsQuery.CountAsync(t =>
                t.TicketStatus != null &&
                t.TicketStatus.StatusName == "In Progress"),

            PendingTickets = await ticketsQuery.CountAsync(t =>
                t.TicketStatus != null &&
                t.TicketStatus.StatusName == "Pending"),

            ResolvedTickets = await ticketsQuery.CountAsync(t =>
                t.TicketStatus != null &&
                t.TicketStatus.StatusName == "Resolved"),

            ClosedTickets = await ticketsQuery.CountAsync(t =>
                t.TicketStatus != null &&
                t.TicketStatus.StatusName == "Closed"),

            HighPriorityTickets = await ticketsQuery.CountAsync(t =>
                t.Priority != null &&
                t.Priority.PriorityName == "High"),

            CriticalPriorityTickets = await ticketsQuery.CountAsync(t =>
                t.Priority != null &&
                t.Priority.PriorityName == "Critical"),

            UnassignedTickets = await ticketsQuery.CountAsync(t =>
                t.AssignedToUserId == null),

            MyAssignedTickets = currentUserId == null
                ? 0
                : await ticketsQuery.CountAsync(t =>
                    t.AssignedToUserId == currentUserId)
        };

        return Ok(summary);
    }

    [HttpGet("tickets-by-status")]
    public async Task<ActionResult<IEnumerable<ChartItemResponse>>> GetTicketsByStatus()
    {
        var result = await GetRoleBasedTicketsQuery()
            .GroupBy(t => t.TicketStatus != null ? t.TicketStatus.StatusName : "Unknown")
            .Select(g => new ChartItemResponse
            {
                Name = g.Key,
                Count = g.Count()
            })
            .ToListAsync();

        return Ok(result);
    }

    [HttpGet("tickets-by-priority")]
    public async Task<ActionResult<IEnumerable<ChartItemResponse>>> GetTicketsByPriority()
    {
        var result = await GetRoleBasedTicketsQuery()
            .GroupBy(t => t.Priority != null ? t.Priority.PriorityName : "Unknown")
            .Select(g => new ChartItemResponse
            {
                Name = g.Key,
                Count = g.Count()
            })
            .ToListAsync();

        return Ok(result);
    }

    [HttpGet("tickets-by-category")]
    public async Task<ActionResult<IEnumerable<ChartItemResponse>>> GetTicketsByCategory()
    {
        var result = await GetRoleBasedTicketsQuery()
            .GroupBy(t => t.Category != null ? t.Category.CategoryName : "Unknown")
            .Select(g => new ChartItemResponse
            {
                Name = g.Key,
                Count = g.Count()
            })
            .ToListAsync();

        return Ok(result);
    }

    [HttpGet("agent-performance")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<IEnumerable<AgentPerformanceResponse>>> GetAgentPerformance()
    {
        var tickets = await _context.Tickets
            .Include(t => t.AssignedToUser)
            .Include(t => t.TicketStatus)
            .Where(t => t.AssignedToUserId != null)
            .ToListAsync();

        var result = tickets
            .GroupBy(t => new
            {
                AgentId = t.AssignedToUserId!,
                AgentName = t.AssignedToUser == null
                    ? "Unknown Agent"
                    : string.IsNullOrWhiteSpace(t.AssignedToUser.FullName)
                        ? t.AssignedToUser.Email
                        : t.AssignedToUser.FullName
            })
            .Select(g => new AgentPerformanceResponse
            {
                AgentId = g.Key.AgentId,
                AgentName = g.Key.AgentName ?? "Unknown Agent",
                AssignedTickets = g.Count(),
                ResolvedTickets = g.Count(t =>
                    t.TicketStatus != null &&
                    t.TicketStatus.StatusName == "Resolved"),
                OpenTickets = g.Count(t =>
                    t.TicketStatus != null &&
                    t.TicketStatus.StatusName != "Resolved" &&
                    t.TicketStatus.StatusName != "Closed")
            })
            .OrderByDescending(a => a.AssignedTickets)
            .ToList();

        return Ok(result);
    }
    
    [HttpGet("recent-activity")]
    public async Task<ActionResult<IEnumerable<RecentActivityResponse>>> GetRecentActivity()
    {
        var currentUserId = GetCurrentUserId();

        var activityQuery = _context.ActivityLogs
            .Include(a => a.Ticket)
            .Include(a => a.User)
            .AsQueryable();

        if (User.IsInRole("Employee"))
        {
            activityQuery = currentUserId == null
                ? activityQuery.Where(_ => false)
                : activityQuery.Where(a =>
                    a.Ticket != null &&
                    a.Ticket.CreatedByUserId == currentUserId);
        }
        else if (User.IsInRole("ITSupportAgent"))
        {
            activityQuery = currentUserId == null
                ? activityQuery.Where(_ => false)
                : activityQuery.Where(a =>
                    a.Ticket != null &&
                    a.Ticket.AssignedToUserId == currentUserId);
        }
        else if (!User.IsInRole("Admin") && !User.IsInRole("Manager"))
        {
            activityQuery = activityQuery.Where(_ => false);
        }

        var result = await activityQuery
            .OrderByDescending(a => a.CreatedAt)
            .Take(10)
            .Select(a => new RecentActivityResponse
            {
                Id = a.Id,
                Action = a.Action ?? string.Empty,
                TicketId = a.TicketId,
                TicketReferenceNumber = a.Ticket != null ? a.Ticket.ReferenceNumber : "",
                PerformedBy = a.User != null ? a.User.Email ?? "Unknown user" : "System",
                CreatedAt = a.CreatedAt
            })
            .ToListAsync();

        return Ok(result);
    }
    private IQueryable<Ticket> GetRoleBasedTicketsQuery()
    {
        var currentUserId = GetCurrentUserId();

        var ticketsQuery = _context.Tickets.AsQueryable();

        if (User.IsInRole("Admin") || User.IsInRole("Manager"))
        {
            return ticketsQuery;
        }

        if (User.IsInRole("ITSupportAgent") && currentUserId != null)
        {
            return ticketsQuery.Where(t => t.AssignedToUserId == currentUserId);
        }

        if (User.IsInRole("Employee") && currentUserId != null)
        {
            return ticketsQuery.Where(t => t.CreatedByUserId == currentUserId);
        }

        return ticketsQuery.Where(t => false);
    }

    private string? GetCurrentUserId()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")
            ?? User.FindFirstValue("id");

        return string.IsNullOrWhiteSpace(userId) ? null : userId;
    }
}
