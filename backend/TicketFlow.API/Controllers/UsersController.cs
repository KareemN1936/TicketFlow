using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using TicketFlow.API.Helpers;
using TicketFlow.API.Models;

namespace TicketFlow.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,ITSupportAgent,Manager")]
public class UsersController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;

    public UsersController(UserManager<ApplicationUser> userManager)
    {
        _userManager = userManager;
    }

    [HttpGet("agents")]
    public async Task<IActionResult> GetSupportAgents()
    {
        var agents = await _userManager.GetUsersInRoleAsync(RoleNames.ITSupportAgent);

        return Ok(agents
            .OrderBy(user => user.UserName)
            .Select(user => new
            {
                user.Id,
                user.UserName,
                user.Email,
                RoleName = RoleNames.ITSupportAgent
            }));
    }
}
