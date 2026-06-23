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
[Route("api/[controller]")]
[Authorize]
public class TicketsController : ControllerBase
{
    private const long MaxAttachmentSize = 10 * 1024 * 1024;
    private static readonly IReadOnlyDictionary<string, string> AllowedAttachmentTypes =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            [".png"] = "image/png",
            [".jpg"] = "image/jpeg",
            [".jpeg"] = "image/jpeg",
            [".pdf"] = "application/pdf",
            [".doc"] = "application/msword",
            [".docx"] = "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            [".txt"] = "text/plain",
            [".log"] = "text/plain"
        };

    private readonly ApplicationDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly string _ticketUploadsRoot;

    public TicketsController(
        ApplicationDbContext context,
        IWebHostEnvironment environment,
        INotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
        _ticketUploadsRoot = Path.Combine(environment.ContentRootPath, "Uploads", "Tickets");
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

        if (User.IsInRole(RoleNames.ITSupportAgent))
        {
            ticketsQuery = ticketsQuery.Where(t => t.AssignedToUserId == currentUserId);
        }
        else if (User.IsInRole(RoleNames.Employee))
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
    [Authorize(Roles = "Admin,Employee")]
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

        var notifications = new List<Notification>();
        if (User.IsInRole(RoleNames.Employee))
        {
            var actorEmail = User.FindFirstValue(ClaimTypes.Email) ?? "An employee";
            var monitoringUserIds = await _notificationService.GetUserIdsInRolesAsync(
                new[] { RoleNames.Admin, RoleNames.Manager });
            notifications.AddRange(await _notificationService.CreateManyAsync(
                monitoringUserIds,
                userId,
                "New ticket created",
                $"{actorEmail} created ticket {ticket.ReferenceNumber}: {ticket.Title}",
                "TicketCreated",
                ticket.Id));
        }

        await _context.SaveChangesAsync();
        await _notificationService.SendManyAsync(notifications);

        return CreatedAtAction(nameof(GetTicket), new { id = ticket.Id }, new
        {
            ticket.Id,
            ticket.ReferenceNumber
        });
    }

    [HttpPut("{id}/assign")]
    [Authorize(Roles = "Admin,Manager")]
    
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

        var oldAssignedUserId = ticket.AssignedToUserId;
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

        var isReassignment = !string.IsNullOrEmpty(oldAssignedUserId)
            && oldAssignedUserId != request.AssignedToUserId;
        var notificationType = isReassignment ? "TicketReassigned" : "TicketAssigned";
        var assignmentNotifications = new List<Notification>();

        assignmentNotifications.AddRange(await _notificationService.CreateManyAsync(
            new[] { request.AssignedToUserId },
            currentUserId,
            isReassignment ? "Ticket reassigned to you" : "Ticket assigned to you",
            $"Ticket {ticket.ReferenceNumber} has been assigned to you.",
            notificationType,
            ticket.Id));

        if (isReassignment)
        {
            assignmentNotifications.AddRange(await _notificationService.CreateManyAsync(
                new[] { oldAssignedUserId },
                currentUserId,
                "Ticket reassigned",
                $"Ticket {ticket.ReferenceNumber} is no longer assigned to you.",
                notificationType,
                ticket.Id));
        }

        assignmentNotifications.AddRange(await _notificationService.CreateManyAsync(
            new[] { ticket.CreatedByUserId },
            currentUserId,
            isReassignment ? "Your ticket was reassigned" : "Your ticket was assigned",
            $"Your ticket {ticket.ReferenceNumber} was assigned to {newAssignedUserName}.",
            notificationType,
            ticket.Id));

        await _context.SaveChangesAsync();
        await _notificationService.SendManyAsync(assignmentNotifications);

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

        if (User.IsInRole(RoleNames.ITSupportAgent)
            && ticket.AssignedToUserId != currentUserId)
        {
            return Forbid();
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

        var isResolved = newStatusName.Equals("Resolved", StringComparison.OrdinalIgnoreCase);
        var isClosed = newStatusName.Equals("Closed", StringComparison.OrdinalIgnoreCase);
        var notificationType = isResolved
            ? "TicketResolved"
            : isClosed
                ? "TicketClosed"
                : "StatusChanged";
        var notificationTitle = isResolved
            ? "Ticket resolved"
            : isClosed
                ? "Ticket closed"
                : "Ticket status updated";

        var statusMessage = $"Ticket {ticket.ReferenceNumber} status changed to {newStatusName}.";
        var statusNotifications = new List<Notification>();
        statusNotifications.AddRange(await _notificationService.CreateManyAsync(
            new[] { ticket.CreatedByUserId },
            currentUserId,
            notificationTitle,
            statusMessage,
            notificationType,
            ticket.Id));

        if (User.IsInRole(RoleNames.Admin) || User.IsInRole(RoleNames.Manager) || isClosed)
        {
            statusNotifications.AddRange(await _notificationService.CreateManyAsync(
                new[] { ticket.AssignedToUserId },
                currentUserId,
                notificationTitle,
                statusMessage,
                notificationType,
                ticket.Id));
        }

        var managerImportantStatuses = new[] { "In Progress", "Pending", "Resolved", "Closed" };
        if (managerImportantStatuses.Contains(newStatusName, StringComparer.OrdinalIgnoreCase))
        {
            var managerIds = await _notificationService.GetUserIdsInRolesAsync(new[] { RoleNames.Manager });
            statusNotifications.AddRange(await _notificationService.CreateManyAsync(
                managerIds,
                currentUserId,
                notificationTitle,
                statusMessage,
                notificationType,
                ticket.Id));
        }

        if (User.IsInRole(RoleNames.ITSupportAgent) && (isResolved || isClosed))
        {
            var adminIds = await _notificationService.GetUserIdsInRolesAsync(new[] { RoleNames.Admin });
            statusNotifications.AddRange(await _notificationService.CreateManyAsync(
                adminIds,
                currentUserId,
                notificationTitle,
                statusMessage,
                notificationType,
                ticket.Id));
        }

        await _context.SaveChangesAsync();
        await _notificationService.SendManyAsync(statusNotifications);

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

        var commentNotifications = new List<Notification>();

        if (!request.IsInternal)
        {
            IReadOnlyList<string> recipientIds;
            if (User.IsInRole(RoleNames.Employee))
            {
                recipientIds = !string.IsNullOrEmpty(ticket.AssignedToUserId)
                    ? new[] { ticket.AssignedToUserId }
                    : await _notificationService.GetUserIdsInRolesAsync(
                        new[] { RoleNames.Admin, RoleNames.Manager });
            }
            else if (User.IsInRole(RoleNames.ITSupportAgent))
            {
                recipientIds = new[] { ticket.CreatedByUserId };
            }
            else
            {
                recipientIds = new[] { ticket.CreatedByUserId, ticket.AssignedToUserId ?? string.Empty };
            }

            var actorEmail = User.FindFirstValue(ClaimTypes.Email) ?? "A TicketFlow user";
            commentNotifications.AddRange(await _notificationService.CreateManyAsync(
                recipientIds,
                currentUserId,
                "New ticket comment",
                $"{actorEmail} added a comment on ticket {ticket.ReferenceNumber}.",
                "CommentAdded",
                ticket.Id));
        }

        await _context.SaveChangesAsync();
        await _notificationService.SendManyAsync(commentNotifications);

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
    [Authorize(Roles = "Admin,ITSupportAgent,Manager")]
    public async Task<IActionResult> UpdateTicket(int id, UpdateTicket request)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrEmpty(currentUserId))
        {
            return Unauthorized();
        }

        var ticket = await _context.Tickets
            .Include(item => item.Priority)
            .FirstOrDefaultAsync(item => item.Id == id);

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

        var newPriority = await _context.Priorities
            .FirstOrDefaultAsync(p => p.Id == request.PriorityId);

        var statusExists = await _context.TicketStatuses
            .AnyAsync(s => s.Id == request.TicketStatusId);

        if (!categoryExists)
        {
            return BadRequest("Invalid category.");
        }

        if (newPriority == null)
        {
            return BadRequest("Invalid priority.");
        }

        if (!statusExists)
        {
            return BadRequest("Invalid status.");
        }

        var priorityChanged = ticket.PriorityId != request.PriorityId;
        var oldPriorityName = ticket.Priority?.PriorityName ?? "Unknown";

        ticket.Title = request.Title;
        ticket.Description = request.Description;
        ticket.CategoryId = request.CategoryId;
        ticket.PriorityId = request.PriorityId;
        ticket.TicketStatusId = request.TicketStatusId;
        ticket.UpdatedAt = DateTime.UtcNow;

        var priorityNotifications = new List<Notification>();
        if (priorityChanged)
        {
            AddActivityLog(
                ticket.Id,
                currentUserId,
                "PriorityChanged",
                oldPriorityName,
                newPriority.PriorityName);

            var recipientIds = new List<string?>
            {
                ticket.AssignedToUserId,
                ticket.CreatedByUserId
            };

            if (newPriority.PriorityName.Equals("High", StringComparison.OrdinalIgnoreCase)
                || newPriority.PriorityName.Equals("Critical", StringComparison.OrdinalIgnoreCase))
            {
                recipientIds.AddRange(await _notificationService.GetUserIdsInRolesAsync(
                    new[] { RoleNames.Manager }));
            }

            if (newPriority.PriorityName.Equals("Critical", StringComparison.OrdinalIgnoreCase))
            {
                recipientIds.AddRange(await _notificationService.GetUserIdsInRolesAsync(
                    new[] { RoleNames.Admin }));
            }

            priorityNotifications.AddRange(await _notificationService.CreateManyAsync(
                recipientIds,
                currentUserId,
                "Ticket priority changed",
                $"Ticket {ticket.ReferenceNumber} priority changed to {newPriority.PriorityName}.",
                "PriorityChanged",
                ticket.Id));
        }

        await _context.SaveChangesAsync();
        await _notificationService.SendManyAsync(priorityNotifications);

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

    [HttpPost("{ticketId}/attachments")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<AttachmentResponse>> UploadAttachment(
        int ticketId,
        [FromForm] IFormFile file,
        CancellationToken cancellationToken)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrEmpty(currentUserId))
        {
            return Unauthorized();
        }

        var ticket = await _context.Tickets
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == ticketId, cancellationToken);

        if (ticket == null)
        {
            return NotFound();
        }

        if (User.IsInRole(RoleNames.ITSupportAgent)
            && ticket.AssignedToUserId != currentUserId)
        {
            return Forbid();
        }

        if (!CanAccessTicketAttachments(ticket, currentUserId))
        {
            return Forbid();
        }

        if (file == null || file.Length == 0)
        {
            return BadRequest("A non-empty file is required.");
        }

        if (file.Length > MaxAttachmentSize)
        {
            return BadRequest("The file exceeds the maximum allowed size of 10 MB.");
        }

        var originalFileName = SanitizeFileName(file.FileName);
        var extension = Path.GetExtension(originalFileName).ToLowerInvariant();

        if (!AllowedAttachmentTypes.TryGetValue(extension, out var contentType))
        {
            return BadRequest("Unsupported file type. Allowed extensions: .png, .jpg, .jpeg, .pdf, .doc, .docx, .txt, .log.");
        }

        var storedFileName = $"{Guid.NewGuid():N}{extension}";
        var ticketDirectory = Path.Combine(_ticketUploadsRoot, ticketId.ToString());
        Directory.CreateDirectory(ticketDirectory);

        var fullPath = Path.Combine(ticketDirectory, storedFileName);
        var relativePath = Path.Combine("Uploads", "Tickets", ticketId.ToString(), storedFileName);
        var uploadedAt = DateTime.UtcNow;

        var attachment = new TicketAttachment
        {
            TicketId = ticketId,
            OriginalFileName = originalFileName,
            StoredFileName = storedFileName,
            FilePath = relativePath,
            ContentType = contentType,
            FileSize = file.Length,
            UploadedByUserId = currentUserId,
            UploadedAt = uploadedAt
        };

        var attachmentNotifications = new List<Notification>();

        try
        {
            await using (var stream = new FileStream(fullPath, FileMode.CreateNew, FileAccess.Write, FileShare.None))
            {
                await file.CopyToAsync(stream, cancellationToken);
            }

            _context.TicketAttachments.Add(attachment);
            AddActivityLog(ticketId, currentUserId, "AttachmentUploaded", null, originalFileName);

            IReadOnlyList<string> recipientIds;
            if (User.IsInRole(RoleNames.Employee))
            {
                recipientIds = !string.IsNullOrEmpty(ticket.AssignedToUserId)
                    ? new[] { ticket.AssignedToUserId }
                    : await _notificationService.GetUserIdsInRolesAsync(
                        new[] { RoleNames.Admin, RoleNames.Manager },
                        cancellationToken);
            }
            else if (User.IsInRole(RoleNames.ITSupportAgent))
            {
                recipientIds = new[] { ticket.CreatedByUserId };
            }
            else
            {
                recipientIds = new[] { ticket.CreatedByUserId, ticket.AssignedToUserId ?? string.Empty };
            }

            attachmentNotifications.AddRange(await _notificationService.CreateManyAsync(
                recipientIds,
                currentUserId,
                "New ticket attachment",
                $"A new file was uploaded to ticket {ticket.ReferenceNumber}.",
                "AttachmentUploaded",
                ticket.Id,
                cancellationToken));

            await _context.SaveChangesAsync(cancellationToken);
            await _notificationService.SendManyAsync(attachmentNotifications, cancellationToken);
        }
        catch
        {
            if (System.IO.File.Exists(fullPath))
            {
                System.IO.File.Delete(fullPath);
            }

            throw;
        }

        var uploader = await _context.Users
            .AsNoTracking()
            .Where(u => u.Id == currentUserId)
            .Select(u => string.IsNullOrWhiteSpace(u.FullName) ? u.UserName ?? u.Email ?? u.Id : u.FullName)
            .FirstOrDefaultAsync(cancellationToken) ?? currentUserId;

        return CreatedAtAction(
            nameof(GetAttachments),
            new { ticketId },
            MapAttachmentResponse(attachment, uploader));
    }

    [HttpGet("{ticketId}/attachments")]
    public async Task<ActionResult<IEnumerable<AttachmentResponse>>> GetAttachments(
        int ticketId,
        CancellationToken cancellationToken)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrEmpty(currentUserId))
        {
            return Unauthorized();
        }

        var ticket = await _context.Tickets
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == ticketId, cancellationToken);

        if (ticket == null)
        {
            return NotFound();
        }

        if (!CanAccessTicketAttachments(ticket, currentUserId))
        {
            return Forbid();
        }

        var attachments = await _context.TicketAttachments
            .AsNoTracking()
            .Where(a => a.TicketId == ticketId)
            .OrderByDescending(a => a.UploadedAt)
            .Select(a => new AttachmentResponse
            {
                Id = a.Id,
                TicketId = a.TicketId,
                FileName = a.OriginalFileName,
                ContentType = a.ContentType,
                FileSize = a.FileSize,
                UploadedBy = a.UploadedByUser == null
                    ? a.UploadedByUserId
                    : !string.IsNullOrWhiteSpace(a.UploadedByUser.FullName)
                        ? a.UploadedByUser.FullName
                        : a.UploadedByUser.UserName ?? a.UploadedByUser.Email ?? a.UploadedByUserId,
                UploadedAt = a.UploadedAt
            })
            .ToListAsync(cancellationToken);

        return Ok(attachments);
    }

    [HttpGet("{ticketId}/attachments/{attachmentId}/download")]
    public async Task<IActionResult> DownloadAttachment(
        int ticketId,
        int attachmentId,
        CancellationToken cancellationToken)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrEmpty(currentUserId))
        {
            return Unauthorized();
        }

        var ticket = await _context.Tickets
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == ticketId, cancellationToken);

        if (ticket == null)
        {
            return NotFound();
        }

        if (!CanAccessTicketAttachments(ticket, currentUserId))
        {
            return Forbid();
        }

        var attachment = await _context.TicketAttachments
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == attachmentId && a.TicketId == ticketId, cancellationToken);

        if (attachment == null)
        {
            return NotFound();
        }

        var fullPath = GetAttachmentFullPath(attachment);

        if (!System.IO.File.Exists(fullPath))
        {
            return NotFound("The attachment file could not be found.");
        }

        return PhysicalFile(fullPath, attachment.ContentType, attachment.OriginalFileName, enableRangeProcessing: true);
    }

    [HttpDelete("{ticketId}/attachments/{attachmentId}")]
    public async Task<IActionResult> DeleteAttachment(
        int ticketId,
        int attachmentId,
        CancellationToken cancellationToken)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrEmpty(currentUserId))
        {
            return Unauthorized();
        }

        var ticket = await _context.Tickets
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == ticketId, cancellationToken);

        if (ticket == null)
        {
            return NotFound();
        }

        if (!CanAccessTicketAttachments(ticket, currentUserId))
        {
            return Forbid();
        }

        var attachment = await _context.TicketAttachments
            .FirstOrDefaultAsync(a => a.Id == attachmentId && a.TicketId == ticketId, cancellationToken);

        if (attachment == null)
        {
            return NotFound();
        }

        var canDelete = User.IsInRole(RoleNames.Admin)
            || User.IsInRole(RoleNames.Manager)
            || (User.IsInRole(RoleNames.ITSupportAgent) && ticket.AssignedToUserId == currentUserId)
            || attachment.UploadedByUserId == currentUserId;

        if (!canDelete)
        {
            return Forbid();
        }

        var fullPath = GetAttachmentFullPath(attachment);

        _context.TicketAttachments.Remove(attachment);
        AddActivityLog(ticketId, currentUserId, "AttachmentDeleted", attachment.OriginalFileName, null);
        await _context.SaveChangesAsync(cancellationToken);

        if (System.IO.File.Exists(fullPath))
        {
            System.IO.File.Delete(fullPath);
        }

        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,ITSupportAgent,Manager")]
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

        var managerIds = await _notificationService.GetUserIdsInRolesAsync(
            new[] { RoleNames.Manager });
        var deletionRecipients = new List<string?>
        {
            ticket.CreatedByUserId,
            ticket.AssignedToUserId
        };
        deletionRecipients.AddRange(managerIds);

        var deletionNotifications = await _notificationService.CreateManyAsync(
            deletionRecipients,
            currentUserId,
            "Ticket deleted",
            $"Ticket {ticket.ReferenceNumber} was deleted.",
            "TicketDeleted",
            null);

        _context.Tickets.Remove(ticket);
        await _context.SaveChangesAsync();
        await _notificationService.SendManyAsync(deletionNotifications);

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
        if (User.IsInRole(RoleNames.Admin) || User.IsInRole(RoleNames.Manager))
        {
            return true;
        }

        if (User.IsInRole(RoleNames.ITSupportAgent))
        {
            return ticket.AssignedToUserId == currentUserId;
        }

        return User.IsInRole(RoleNames.Employee) && ticket.CreatedByUserId == currentUserId;
    }

    private bool CanAccessTicketAttachments(Ticket ticket, string currentUserId)
    {
        if (User.IsInRole(RoleNames.Admin) || User.IsInRole(RoleNames.Manager))
        {
            return true;
        }

        if (User.IsInRole(RoleNames.ITSupportAgent))
        {
            return ticket.AssignedToUserId == currentUserId;
        }

        return User.IsInRole(RoleNames.Employee) && ticket.CreatedByUserId == currentUserId;
    }

    private string GetAttachmentFullPath(TicketAttachment attachment)
    {
        var ticketDirectory = Path.GetFullPath(Path.Combine(_ticketUploadsRoot, attachment.TicketId.ToString()));
        var fullPath = Path.GetFullPath(Path.Combine(ticketDirectory, attachment.StoredFileName));
        var directoryPrefix = ticketDirectory + Path.DirectorySeparatorChar;

        if (!fullPath.StartsWith(directoryPrefix, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Invalid attachment storage path.");
        }

        return fullPath;
    }

    private static string SanitizeFileName(string fileName)
    {
        var name = Path.GetFileName(fileName).Trim();

        if (string.IsNullOrWhiteSpace(name))
        {
            return "attachment";
        }

        var invalidCharacters = Path.GetInvalidFileNameChars();
        var sanitized = new string(name
            .Select(character => invalidCharacters.Contains(character) || char.IsControl(character) ? '_' : character)
            .ToArray());

        if (sanitized.Length <= 255)
        {
            return sanitized;
        }

        var extension = Path.GetExtension(sanitized);
        var baseName = Path.GetFileNameWithoutExtension(sanitized);
        var maximumBaseLength = Math.Max(1, 255 - extension.Length);

        return $"{baseName[..Math.Min(baseName.Length, maximumBaseLength)]}{extension}";
    }

    private static AttachmentResponse MapAttachmentResponse(TicketAttachment attachment, string uploadedBy)
    {
        return new AttachmentResponse
        {
            Id = attachment.Id,
            TicketId = attachment.TicketId,
            FileName = attachment.OriginalFileName,
            ContentType = attachment.ContentType,
            FileSize = attachment.FileSize,
            UploadedBy = uploadedBy,
            UploadedAt = attachment.UploadedAt
        };
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
