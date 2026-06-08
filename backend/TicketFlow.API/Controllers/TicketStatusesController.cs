using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TicketFlow.API.Data;

namespace TicketFlow.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TicketStatusesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public TicketStatusesController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetTicketStatuses()
    {
        var statuses = await _context.TicketStatuses
            .OrderBy(s => s.Id)
            .Select(s => new
            {
                s.Id,
                s.StatusName
            })
            .ToListAsync();

        return Ok(statuses);
    }
}