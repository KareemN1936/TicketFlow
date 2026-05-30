using HelpDeskSystem.API.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HelpDeskSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TestController : ControllerBase
{
    [Authorize]
    [HttpGet("protected")]
    public IActionResult Protected()
    {
        return Ok(new { message = "Any logged-in user can access this." });
    }

    [Authorize(Roles = RoleNames.Employee)]
    [HttpGet("employee")]
    public IActionResult EmployeeOnly()
    {
        return Ok(new { message = "Employee access granted." });
    }

    [Authorize(Roles = RoleNames.ITSupportAgent)]
    [HttpGet("agent")]
    public IActionResult AgentOnly()
    {
        return Ok(new { message = "IT Support Agent access granted." });
    }

    [Authorize(Roles = RoleNames.Manager)]
    [HttpGet("manager")]
    public IActionResult ManagerOnly()
    {
        return Ok(new { message = "Manager access granted." });
    }

    [Authorize(Roles = RoleNames.Admin)]
    [HttpGet("admin")]
    public IActionResult AdminOnly()
    {
        return Ok(new { message = "Admin access granted." });
    }
}