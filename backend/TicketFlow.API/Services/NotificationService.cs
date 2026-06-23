using TicketFlow.API.Data;
using TicketFlow.API.Dtos;
using TicketFlow.API.Hubs;
using TicketFlow.API.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace TicketFlow.API.Services;

public interface INotificationService
{
    Task<Notification?> CreateAsync(
        string recipientUserId,
        string actorUserId,
        string title,
        string message,
        string type,
        int? ticketId,
        CancellationToken cancellationToken = default);

    Task SendAsync(Notification? notification, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Notification>> CreateManyAsync(
        IEnumerable<string?> recipientUserIds,
        string actorUserId,
        string title,
        string message,
        string type,
        int? ticketId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<string>> GetUserIdsInRolesAsync(
        IEnumerable<string> roleNames,
        CancellationToken cancellationToken = default);

    Task SendManyAsync(
        IEnumerable<Notification> notifications,
        CancellationToken cancellationToken = default);
}

public class NotificationService : INotificationService
{
    private readonly ApplicationDbContext _context;
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly ILogger<NotificationService> _logger;
    private readonly IWebHostEnvironment _environment;

    public NotificationService(
        ApplicationDbContext context,
        IHubContext<NotificationHub> hubContext,
        ILogger<NotificationService> logger,
        IWebHostEnvironment environment)
    {
        _context = context;
        _hubContext = hubContext;
        _logger = logger;
        _environment = environment;
    }

    public async Task<Notification?> CreateAsync(
        string recipientUserId,
        string actorUserId,
        string title,
        string message,
        string type,
        int? ticketId,
        CancellationToken cancellationToken = default)
    {
        if (_environment.IsDevelopment())
        {
            _logger.LogDebug(
                "Notification attempt: recipient {RecipientUserId}, actor {ActorUserId}, type {NotificationType}.",
                recipientUserId,
                actorUserId,
                type);
        }

        if (string.IsNullOrWhiteSpace(recipientUserId) || recipientUserId == actorUserId)
        {
            if (_environment.IsDevelopment())
            {
                _logger.LogDebug(
                    "Notification skipped for type {NotificationType}: recipient is empty or is the actor.",
                    type);
            }
            return null;
        }

        var alreadyQueued = _context.Notifications.Local.Any(notification =>
            notification.UserId == recipientUserId
            && notification.Title == title
            && notification.Message == message
            && notification.Type == type
            && notification.TicketId == ticketId);

        if (alreadyQueued)
        {
            return null;
        }

        var notification = new Notification
        {
            UserId = recipientUserId,
            Title = title,
            Message = message,
            Type = type,
            TicketId = ticketId,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        await _context.Notifications.AddAsync(notification, cancellationToken);
        return notification;
    }

    public async Task<IReadOnlyList<Notification>> CreateManyAsync(
        IEnumerable<string?> recipientUserIds,
        string actorUserId,
        string title,
        string message,
        string type,
        int? ticketId,
        CancellationToken cancellationToken = default)
    {
        var notifications = new List<Notification>();
        var recipients = recipientUserIds
            .Where(userId => !string.IsNullOrWhiteSpace(userId))
            .Select(userId => userId!)
            .Distinct(StringComparer.Ordinal)
            .ToList();

        foreach (var recipientUserId in recipients)
        {
            var notification = await CreateAsync(
                recipientUserId,
                actorUserId,
                title,
                message,
                type,
                ticketId,
                cancellationToken);

            if (notification != null)
            {
                notifications.Add(notification);
            }
        }

        return notifications;
    }

    public async Task<IReadOnlyList<string>> GetUserIdsInRolesAsync(
        IEnumerable<string> roleNames,
        CancellationToken cancellationToken = default)
    {
        var normalizedRoleNames = roleNames
            .Where(roleName => !string.IsNullOrWhiteSpace(roleName))
            .Select(roleName => roleName.ToUpperInvariant())
            .Distinct()
            .ToList();

        return await _context.UserRoles
            .Join(
                _context.Roles,
                userRole => userRole.RoleId,
                role => role.Id,
                (userRole, role) => new { userRole.UserId, role.NormalizedName })
            .Where(item => item.NormalizedName != null && normalizedRoleNames.Contains(item.NormalizedName))
            .Select(item => item.UserId)
            .Distinct()
            .ToListAsync(cancellationToken);
    }

    public async Task SendAsync(Notification? notification, CancellationToken cancellationToken = default)
    {
        if (notification == null)
        {
            return;
        }

        try
        {
            await _hubContext.Clients.User(notification.UserId).SendAsync(
                "ReceiveNotification",
                new NotificationResponse
                {
                    Id = notification.Id,
                    Title = notification.Title,
                    Message = notification.Message,
                    Type = notification.Type,
                    TicketId = notification.TicketId,
                    IsRead = notification.IsRead,
                    CreatedAt = notification.CreatedAt
                },
                cancellationToken);
        }
        catch (Exception exception)
        {
            _logger.LogWarning(
                exception,
                "Notification {NotificationId} was saved but could not be delivered through SignalR.",
                notification.Id);
        }
    }

    public async Task SendManyAsync(
        IEnumerable<Notification> notifications,
        CancellationToken cancellationToken = default)
    {
        foreach (var notification in notifications)
        {
            await SendAsync(notification, cancellationToken);
        }
    }
}
