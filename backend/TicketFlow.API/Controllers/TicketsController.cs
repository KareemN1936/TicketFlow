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
public class TicketsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public TicketsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TicketResponse>>> GetTickets()
    {
        var tickets = await _context.Tickets
            .Include(t => t.CreatedByUser)
            .Include(t => t.Category)
            .Include(t => t.Priority)
            .Include(t => t.TicketStatus)
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new TicketResponse
            {
                Id = t.Id,
                ReferenceNumber = t.ReferenceNumber,
                Title = t.Title,
                Description = t.Description,
                CreatedByUserId = t.CreatedByUserId,
                CreatedByUserName = t.CreatedByUser != null ? t.CreatedByUser.UserName ?? "" : "",
                CategoryId = t.CategoryId,
                CategoryName = t.Category != null ? t.Category.CategoryName : "",
                PriorityId = t.PriorityId,
                PriorityName = t.Priority != null ? t.Priority.PriorityName : "",
                TicketStatusId = t.TicketStatusId,
                StatusName = t.TicketStatus != null ? t.TicketStatus.StatusName : "",
                CreatedAt = t.CreatedAt,
                UpdatedAt = t.UpdatedAt
            })
            .ToListAsync();

        return Ok(tickets);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TicketResponse>> GetTicket(int id)
    {
        var ticket = await _context.Tickets
            .Include(t => t.CreatedByUser)
            .Include(t => t.Category)
            .Include(t => t.Priority)
            .Include(t => t.TicketStatus)
            .Where(t => t.Id == id)
            .Select(t => new TicketResponse
            {
                Id = t.Id,
                ReferenceNumber = t.ReferenceNumber,
                Title = t.Title,
                Description = t.Description,
                CreatedByUserId = t.CreatedByUserId,
                CreatedByUserName = t.CreatedByUser != null ? t.CreatedByUser.UserName ?? "" : "",
                CategoryId = t.CategoryId,
                CategoryName = t.Category != null ? t.Category.CategoryName : "",
                PriorityId = t.PriorityId,
                PriorityName = t.Priority != null ? t.Priority.PriorityName : "",
                TicketStatusId = t.TicketStatusId,
                StatusName = t.TicketStatus != null ? t.TicketStatus.StatusName : "",
                CreatedAt = t.CreatedAt,
                UpdatedAt = t.UpdatedAt
            })
            .FirstOrDefaultAsync();

        if (ticket == null)
        {
            return NotFound();
        }

        return Ok(ticket);
    }

    [HttpPost]
    public async Task<ActionResult<TicketResponse>> CreateTicket(CreateTicket request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var categoryExists = await _context.Categories.AnyAsync(c => c.Id == request.CategoryId);
        var priorityExists = await _context.Priorities.AnyAsync(p => p.Id == request.PriorityId);

        if (!categoryExists)
        {
            return BadRequest("Invalid category.");
        }

        if (!priorityExists)
        {
            return BadRequest("Invalid priority.");
        }

        var ticket = new Ticket
        {
            ReferenceNumber = $"TCK-{DateTime.UtcNow:yyyyMMddHHmmss}",
            Title = request.Title,
            Description = request.Description,
            CreatedByUserId = userId,
            CategoryId = request.CategoryId,
            PriorityId = request.PriorityId,
            TicketStatusId = 1,
            CreatedAt = DateTime.UtcNow
        };

        _context.Tickets.Add(ticket);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetTicket), new { id = ticket.Id }, new
        {
            ticket.Id,
            ticket.ReferenceNumber
        });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateTicket(int id, UpdateTicket request)
    {
        var ticket = await _context.Tickets.FindAsync(id);

        if (ticket == null)
        {
            return NotFound();
        }

        var categoryExists = await _context.Categories.AnyAsync(c => c.Id == request.CategoryId);
        var priorityExists = await _context.Priorities.AnyAsync(p => p.Id == request.PriorityId);
        var statusExists = await _context.TicketStatuses.AnyAsync(s => s.Id == request.TicketStatusId);

        if (!categoryExists)
        {
            return BadRequest("Invalid category.");
        }

        if (!priorityExists)
        {
            return BadRequest("Invalid priority.");
        }

        if (!statusExists)
        {
            return BadRequest("Invalid status.");
        }

        ticket.Title = request.Title;
        ticket.Description = request.Description;
        ticket.CategoryId = request.CategoryId;
        ticket.PriorityId = request.PriorityId;
        ticket.TicketStatusId = request.TicketStatusId;
        ticket.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTicket(int id)
    {
        var ticket = await _context.Tickets.FindAsync(id);

        if (ticket == null)
        {
            return NotFound();
        }

        _context.Tickets.Remove(ticket);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}