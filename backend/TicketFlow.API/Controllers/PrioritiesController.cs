using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TicketFlow.API.Data;

namespace TicketFlow.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PrioritiesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public PrioritiesController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetPriorities()
    {
        var priorities = await _context.Priorities
            .OrderBy(p => p.Id)
            .Select(p => new
            {
                p.Id,
                p.PriorityName
            })
            .ToListAsync();

        return Ok(priorities);
    }
}