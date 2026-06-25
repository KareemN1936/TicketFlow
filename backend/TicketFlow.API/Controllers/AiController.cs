using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TicketFlow.API.Data;
using TicketFlow.API.Dtos;
using TicketFlow.API.Helpers;
using TicketFlow.API.Models;
using TicketFlow.API.Services;

namespace TicketFlow.API.Controllers;

[ApiController]
[Route("api/ai")]
[Authorize]
public class AiController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IAiTicketService _ai;
    private readonly ILogger<AiController> _logger;

    public AiController(ApplicationDbContext context, IAiTicketService ai, ILogger<AiController> logger)
    {
        _context = context;
        _ai = ai;
        _logger = logger;
    }

    [HttpPost("suggest-category")]
    public async Task<ActionResult<AiSuggestionResponse>> SuggestCategory(AiTicketTextRequest request, CancellationToken cancellationToken)
    {
        var choices = await _context.Categories.AsNoTracking().OrderBy(x => x.CategoryName).Select(x => new { x.Id, Name = x.CategoryName }).ToListAsync(cancellationToken);
        return Ok(await _ai.SuggestAsync(request, choices.Select(x => (x.Id, x.Name)).ToList(), "category", cancellationToken));
    }

    [HttpPost("suggest-priority")]
    public async Task<ActionResult<AiSuggestionResponse>> SuggestPriority(AiTicketTextRequest request, CancellationToken cancellationToken)
    {
        var choices = await _context.Priorities.AsNoTracking().OrderBy(x => x.Id).Select(x => new { x.Id, Name = x.PriorityName }).ToListAsync(cancellationToken);
        return Ok(await _ai.SuggestAsync(request, choices.Select(x => (x.Id, x.Name)).ToList(), "priority", cancellationToken));
    }

    [HttpPost("summarize-ticket")]
    public async Task<ActionResult<AiTextResponse>> Summarize(AiTicketRequest request, CancellationToken cancellationToken)
    {
        if (request.TicketId.HasValue && !await CanAccessTicket(request.TicketId.Value, cancellationToken)) return Forbid();
        var prompt = $"Title: {request.Title}\nDescription: {request.Description}\nCategory: {request.Category}\nPriority: {request.Priority}\nStatus: {request.Status}\nComments: {string.Join(" | ", request.Comments.Take(20))}";
        return await SafelyComplete("Summarize this IT ticket concisely. Include: Summary, Key issue, Affected area, Current status, Next recommended action. Do not invent facts.", prompt, cancellationToken);
    }

    [HttpPost("troubleshooting-suggestions")]
    [Authorize(Roles = "Admin,ITSupportAgent")]
    public async Task<ActionResult<AiTextResponse>> Troubleshooting(AiTicketRequest request, CancellationToken cancellationToken)
    {
        if (request.TicketId.HasValue && !await CanAccessTicket(request.TicketId.Value, cancellationToken)) return Forbid();
        var prompt = $"Title: {request.Title}\nDescription: {request.Description}\nCategory: {request.Category}\nPriority: {request.Priority}";
        return await SafelyComplete("Give 3 to 5 practical, safe troubleshooting steps for an IT support agent. Be professional and realistic. Never recommend destructive actions; any risky last resort must require explicit approval and backup verification.", prompt, cancellationToken);
    }

    [HttpPost("chat")]
    public async Task<ActionResult<AiTextResponse>> Chat(AiChatRequest request, CancellationToken cancellationToken) =>
        await SafelyComplete("You are TicketFlow's employee IT help assistant. Give safe, concise help for common IT issues. Suggest creating a ticket when human support is needed. Never claim a ticket was created. When useful, include a suggested ticket title, category, and priority, clearly labeled as suggestions.", request.Message, cancellationToken);

    private async Task<ActionResult<AiTextResponse>> SafelyComplete(string system, string prompt, CancellationToken cancellationToken)
    {
        try { return Ok(await _ai.CompleteAsync(system, prompt, cancellationToken)); }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            _logger.LogWarning(ex, "AI request failed");
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new AiTextResponse { Content = "AI is temporarily unavailable. Please try again later." });
        }
    }

    private async Task<bool> CanAccessTicket(int ticketId, CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        var ticket = await _context.Tickets.AsNoTracking().FirstOrDefaultAsync(x => x.Id == ticketId, cancellationToken);
        if (ticket == null) return false;
        if (User.IsInRole(RoleNames.Admin) || User.IsInRole(RoleNames.Manager)) return true;
        if (User.IsInRole(RoleNames.ITSupportAgent)) return ticket.AssignedToUserId == userId;
        return User.IsInRole(RoleNames.Employee) && ticket.CreatedByUserId == userId;
    }
}
