using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TicketFlow.API.Data;
using TicketFlow.API.Dtos;
using TicketFlow.API.Helpers;
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
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrEmpty(currentUserId))
        {
            return Unauthorized();
        }

        var ticketsQuery = _context.Tickets
            .Include(t => t.CreatedByUser)
            .Include(t => t.AssignedToUser)
            .Include(t => t.Category)
            .Include(t => t.Priority)
            .Include(t => t.TicketStatus)
            .AsQueryable();

        if (User.IsInRole(RoleNames.Employee) && !IsWorkflowUser())
        {
            ticketsQuery = ticketsQuery.Where(t => t.CreatedByUserId == currentUserId);
        }

        var tickets = await ticketsQuery
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new TicketResponse
            {
                Id = t.Id,
                ReferenceNumber = t.ReferenceNumber,
                Title = t.Title,
                Description = t.Description,

                CreatedByUserId = t.CreatedByUserId,
                CreatedByUserName = t.CreatedByUser != null
                    ? t.CreatedByUser.UserName ?? ""
                    : "",

                AssignedToUserId = t.AssignedToUserId,
                AssignedToUserName = t.AssignedToUser != null
                    ? t.AssignedToUser.UserName ?? ""
                    : "",

                CategoryId = t.CategoryId,
                CategoryName = t.Category != null
                    ? t.Category.CategoryName
                    : "",

                PriorityId = t.PriorityId,
                PriorityName = t.Priority != null
                    ? t.Priority.PriorityName
                    : "",

                TicketStatusId = t.TicketStatusId,
                StatusName = t.TicketStatus != null
                    ? t.TicketStatus.StatusName
                    : "",

                CreatedAt = t.CreatedAt,
                UpdatedAt = t.UpdatedAt
            })
            .ToListAsync();

        return Ok(tickets);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TicketResponse>> GetTicket(int id)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrEmpty(currentUserId))
        {
            return Unauthorized();
        }

        var canViewInternalContent = IsWorkflowUser();

        var ticket = await _context.Tickets
            .Include(t => t.CreatedByUser)
            .Include(t => t.AssignedToUser)
            .Include(t => t.Category)
            .Include(t => t.Priority)
            .Include(t => t.TicketStatus)
            .Include(t => t.Comments)
                .ThenInclude(c => c.User)
            .Include(t => t.ActivityLogs)
                .ThenInclude(a => a.User)
            .Where(t => t.Id == id)
            .FirstOrDefaultAsync();

        if (ticket == null)
        {
            return NotFound();
        }

        if (!CanAccessTicket(ticket, currentUserId))
        {
            return Forbid();
        }

        var response = MapTicketResponse(ticket);

        response.Comments = ticket.Comments
            .Where(c => canViewInternalContent || !c.IsInternal)
            .OrderBy(c => c.CreatedAt)
            .Select(MapCommentResponse)
            .ToList();

        response.ActivityLogs = ticket.ActivityLogs
            .Where(a => canViewInternalContent || a.Action != "InternalNoteAdded")
            .OrderBy(a => a.CreatedAt)
            .Select(MapActivityLogResponse)
            .ToList();

        return Ok(response);
    }

    [HttpPost]
    public async Task<ActionResult<TicketResponse>> CreateTicket(CreateTicket request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var categoryExists = await _context.Categories
            .AnyAsync(c => c.Id == request.CategoryId);

        var priorityExists = await _context.Priorities
            .AnyAsync(p => p.Id == request.PriorityId);

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

        AddActivityLog(
            ticket.Id,
            userId,
            "TicketCreated",
            null,
            ticket.ReferenceNumber
        );

        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetTicket), new { id = ticket.Id }, new
        {
            ticket.Id,
            ticket.ReferenceNumber
        });
    }

    [HttpPut("{id}/assign")]
    [Authorize(Roles = "Admin,ITSupportAgent,Manager")]    
    
    public async Task<IActionResult> AssignTicket(int id, AssignTicket request)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrEmpty(currentUserId))
        {
            return Unauthorized();
        }

        var ticket = await _context.Tickets
            .Include(t => t.AssignedToUser)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (ticket == null)
        {
            return NotFound();
        }

        var assignedUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == request.AssignedToUserId);

        if (assignedUser == null)
        {
            return BadRequest("Assigned user not found.");
        }

        var isAgent = await _context.UserRoles
            .Join(
                _context.Roles,
                userRole => userRole.RoleId,
                role => role.Id,
                (userRole, role) => new { userRole.UserId, RoleName = role.Name }
            )
            .AnyAsync(x =>
                x.UserId == request.AssignedToUserId &&
                x.RoleName == "ITSupportAgent"
            );

        if (!isAgent)
        {
            return BadRequest("Ticket can only be assigned to a user with the ITSupportAgent role.");
        }

        var oldAssignedUserName = ticket.AssignedToUser != null
            ? ticket.AssignedToUser.UserName ?? ticket.AssignedToUser.Email ?? "Unknown User"
            : "Unassigned";

        var newAssignedUserName = assignedUser.UserName
            ?? assignedUser.Email
            ?? request.AssignedToUserId;

        ticket.AssignedToUserId = request.AssignedToUserId;
        ticket.UpdatedAt = DateTime.UtcNow;

        var action = oldAssignedUserName == "Unassigned"
            ? "TicketAssigned"
            : "TicketReassigned";

        AddActivityLog(
            ticket.Id,
            currentUserId,
            action,
            oldAssignedUserName,
            newAssignedUserName
        );

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPut("{id}/status")]
    [Authorize(Roles = "Admin,ITSupportAgent,Manager")]
    public async Task<IActionResult> UpdateTicketStatus(int id, UpdateTicketStatus request)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrEmpty(currentUserId))
        {
            return Unauthorized();
        }

        var ticket = await _context.Tickets
            .Include(t => t.TicketStatus)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (ticket == null)
        {
            return NotFound();
        }

        var newStatus = await _context.TicketStatuses
            .FirstOrDefaultAsync(s => s.Id == request.TicketStatusId);

        if (newStatus == null)
        {
            return BadRequest("Invalid status.");
        }

        var oldStatusName = ticket.TicketStatus != null
            ? ticket.TicketStatus.StatusName
            : "Unknown";

        var newStatusName = newStatus.StatusName;

        if (ticket.TicketStatusId == request.TicketStatusId)
        {
            return BadRequest("Ticket already has this status.");
        }

        ticket.TicketStatusId = request.TicketStatusId;
        ticket.UpdatedAt = DateTime.UtcNow;

        AddActivityLog(
            ticket.Id,
            currentUserId,
            "StatusChanged",
            oldStatusName,
            newStatusName
        );

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPost("{id}/comments")]
    public async Task<ActionResult<TicketCommentResponse>> AddComment(int id, CreateTicketComment request)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrEmpty(currentUserId))
        {
            return Unauthorized();
        }

        var ticket = await _context.Tickets
            .FirstOrDefaultAsync(t => t.Id == id);

        if (ticket == null)
        {
            return NotFound();
        }

        if (!CanAccessTicket(ticket, currentUserId))
        {
            return Forbid();
        }

        if (string.IsNullOrWhiteSpace(request.CommentText))
        {
            return BadRequest("Comment cannot be empty.");
        }

        var isWorkflowUser = IsWorkflowUser();

        if (request.IsInternal && !isWorkflowUser)
        {
            return Forbid();
        }

        var comment = new TicketComment
        {
            TicketId = ticket.Id,
            UserId = currentUserId,
            CommentText = request.CommentText,
            IsInternal = request.IsInternal,
            CreatedAt = DateTime.UtcNow
        };

        _context.TicketComments.Add(comment);

        ticket.UpdatedAt = DateTime.UtcNow;

        AddActivityLog(
            ticket.Id,
            currentUserId,
            request.IsInternal ? "InternalNoteAdded" : "CommentAdded",
            null,
            request.IsInternal ? "Internal note added" : SummarizeComment(request.CommentText)
        );

        await _context.SaveChangesAsync();

        var createdComment = await _context.TicketComments
            .Include(c => c.User)
            .Where(c => c.Id == comment.Id)
            .Select(c => new TicketCommentResponse
            {
                Id = c.Id,
                TicketId = c.TicketId,
                UserId = c.UserId,
                UserName = c.User != null ? c.User.UserName ?? "" : "",
                CommentText = c.CommentText,
                IsInternal = c.IsInternal,
                CreatedAt = c.CreatedAt
            })
            .FirstAsync();

        return Ok(createdComment);
    }

    [HttpGet("{id}/comments")]
    public async Task<ActionResult<IEnumerable<TicketCommentResponse>>> GetComments(int id)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrEmpty(currentUserId))
        {
            return Unauthorized();
        }

        var ticket = await _context.Tickets
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == id);

        if (ticket == null)
        {
            return NotFound();
        }

        if (!CanAccessTicket(ticket, currentUserId))
        {
            return Forbid();
        }

        var isWorkflowUser = IsWorkflowUser();

        var commentsQuery = _context.TicketComments
            .Include(c => c.User)
            .Where(c => c.TicketId == id);

        if (!isWorkflowUser)
        {
            commentsQuery = commentsQuery.Where(c => !c.IsInternal);
        }

        var comments = await commentsQuery
            .OrderBy(c => c.CreatedAt)
            .Select(c => new TicketCommentResponse
            {
                Id = c.Id,
                TicketId = c.TicketId,
                UserId = c.UserId,
                UserName = c.User != null ? c.User.UserName ?? "" : "",
                CommentText = c.CommentText,
                IsInternal = c.IsInternal,
                CreatedAt = c.CreatedAt
            })
            .ToListAsync();

        return Ok(comments);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateTicket(int id, UpdateTicket request)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrEmpty(currentUserId))
        {
            return Unauthorized();
        }

        var ticket = await _context.Tickets.FindAsync(id);

        if (ticket == null)
        {
            return NotFound();
        }

        if (!CanAccessTicket(ticket, currentUserId))
        {
            return Forbid();
        }

        if (ticket.TicketStatusId != request.TicketStatusId)
        {
            return BadRequest("Use the ticket status endpoint to change workflow status.");
        }

        var categoryExists = await _context.Categories
            .AnyAsync(c => c.Id == request.CategoryId);

        var priorityExists = await _context.Priorities
            .AnyAsync(p => p.Id == request.PriorityId);

        var statusExists = await _context.TicketStatuses
            .AnyAsync(s => s.Id == request.TicketStatusId);

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
    [HttpGet("{id}/activity")]
    public async Task<ActionResult<IEnumerable<ActivityLogResponse>>> GetActivityLogs(int id)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrEmpty(currentUserId))
        {
            return Unauthorized();
        }

        var ticket = await _context.Tickets
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == id);

        if (ticket == null)
        {
            return NotFound();
        }

        if (!CanAccessTicket(ticket, currentUserId))
        {
            return Forbid();
        }

        var activityQuery = _context.ActivityLogs
            .Include(a => a.User)
            .Where(a => a.TicketId == id);

        if (!IsWorkflowUser())
        {
            activityQuery = activityQuery.Where(a => a.Action != "InternalNoteAdded");
        }

        var activityLogs = await activityQuery
            .OrderBy(a => a.CreatedAt)
            .Select(a => new ActivityLogResponse
            {
                Id = a.Id,
                TicketId = a.TicketId,
                UserId = a.UserId,
                UserName = a.User != null ? a.User.UserName ?? "" : "",
                Action = a.Action,
                OldValue = a.OldValue,
                NewValue = a.NewValue,
                CreatedAt = a.CreatedAt
            })
            .ToListAsync();

        return Ok(activityLogs);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTicket(int id)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrEmpty(currentUserId))
        {
            return Unauthorized();
        }

        var ticket = await _context.Tickets.FindAsync(id);

        if (ticket == null)
        {
            return NotFound();
        }

        if (!CanAccessTicket(ticket, currentUserId))
        {
            return Forbid();
        }

        _context.Tickets.Remove(ticket);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private void AddActivityLog(
        int ticketId,
        string userId,
        string action,
        string? oldValue,
        string? newValue)
    {
        var activityLog = new ActivityLog
        {
            TicketId = ticketId,
            UserId = userId,
            Action = action,
            OldValue = oldValue,
            NewValue = newValue,
            CreatedAt = DateTime.UtcNow
        };

        _context.ActivityLogs.Add(activityLog);
    }

    private bool IsWorkflowUser()
    {
        return User.IsInRole(RoleNames.Admin)
            || User.IsInRole(RoleNames.ITSupportAgent)
            || User.IsInRole(RoleNames.Manager);
    }

    private bool CanAccessTicket(Ticket ticket, string currentUserId)
    {
        return IsWorkflowUser() || ticket.CreatedByUserId == currentUserId;
    }

    private static string SummarizeComment(string commentText)
    {
        const int maxLength = 80;
        var normalized = commentText.Trim();

        return normalized.Length <= maxLength
            ? normalized
            : $"{normalized[..maxLength]}...";
    }

    private static TicketResponse MapTicketResponse(Ticket ticket)
    {
        return new TicketResponse
        {
            Id = ticket.Id,
            ReferenceNumber = ticket.ReferenceNumber,
            Title = ticket.Title,
            Description = ticket.Description,
            CreatedByUserId = ticket.CreatedByUserId,
            CreatedByUserName = ticket.CreatedByUser?.UserName ?? string.Empty,
            AssignedToUserId = ticket.AssignedToUserId,
            AssignedToUserName = ticket.AssignedToUser?.UserName ?? string.Empty,
            CategoryId = ticket.CategoryId,
            CategoryName = ticket.Category?.CategoryName ?? string.Empty,
            PriorityId = ticket.PriorityId,
            PriorityName = ticket.Priority?.PriorityName ?? string.Empty,
            TicketStatusId = ticket.TicketStatusId,
            StatusName = ticket.TicketStatus?.StatusName ?? string.Empty,
            CreatedAt = ticket.CreatedAt,
            UpdatedAt = ticket.UpdatedAt
        };
    }

    private static TicketCommentResponse MapCommentResponse(TicketComment comment)
    {
        return new TicketCommentResponse
        {
            Id = comment.Id,
            TicketId = comment.TicketId,
            UserId = comment.UserId,
            UserName = comment.User?.UserName ?? string.Empty,
            CommentText = comment.CommentText,
            IsInternal = comment.IsInternal,
            CreatedAt = comment.CreatedAt
        };
    }

    private static ActivityLogResponse MapActivityLogResponse(ActivityLog activityLog)
    {
        return new ActivityLogResponse
        {
            Id = activityLog.Id,
            TicketId = activityLog.TicketId,
            UserId = activityLog.UserId,
            UserName = activityLog.User?.UserName ?? string.Empty,
            Action = activityLog.Action,
            OldValue = activityLog.OldValue,
            NewValue = activityLog.NewValue,
            CreatedAt = activityLog.CreatedAt
        };
    }
}
