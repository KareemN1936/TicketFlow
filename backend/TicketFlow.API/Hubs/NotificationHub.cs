using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace TicketFlow.API.Hubs;

[Authorize]
public class NotificationHub : Hub
{
}

