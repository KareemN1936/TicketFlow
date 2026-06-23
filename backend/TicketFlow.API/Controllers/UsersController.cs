using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using TicketFlow.API.DTOs;
using TicketFlow.API.Helpers;
using TicketFlow.API.Models;

namespace TicketFlow.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,ITSupportAgent,Manager")]
public class UsersController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;

    public UsersController(
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager)
    {
        _userManager = userManager;
        _roleManager = roleManager;
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

    [HttpGet]
    [Authorize(Roles = RoleNames.Admin)]
    public async Task<ActionResult<IEnumerable<AdminUserResponse>>> GetUsers()
    {
        var users = await _userManager.Users
            .AsNoTracking()
            .OrderBy(user => user.FullName)
            .ThenBy(user => user.Email)
            .ToListAsync();

        var result = new List<AdminUserResponse>(users.Count);
        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);
            result.Add(ToResponse(user, roles.FirstOrDefault()));
        }

        return Ok(result);
    }

    [HttpGet("roles")]
    [Authorize(Roles = RoleNames.Admin)]
    public async Task<ActionResult<IEnumerable<string>>> GetRoles()
    {
        var roles = await _roleManager.Roles
            .AsNoTracking()
            .Select(role => role.Name!)
            .Where(name => name != null)
            .OrderBy(name => name)
            .ToListAsync();

        return Ok(roles);
    }

    [HttpPost]
    [Authorize(Roles = RoleNames.Admin)]
    public async Task<ActionResult<AdminUserResponse>> CreateUser(CreateAdminUserRequest request)
    {
        var email = request.Email.Trim();
        var role = request.Role.Trim();

        if (await _userManager.FindByEmailAsync(email) != null)
        {
            return Conflict(new { message = "A user with this email already exists." });
        }

        if (!await _roleManager.RoleExistsAsync(role))
        {
            return BadRequest(new { message = "The selected role is invalid." });
        }

        var user = new ApplicationUser
        {
            FullName = request.FullName.Trim(),
            UserName = email,
            Email = email
        };

        var createResult = await _userManager.CreateAsync(user, request.Password);
        if (!createResult.Succeeded)
        {
            return BadRequest(new
            {
                message = "The user could not be created.",
                errors = createResult.Errors.Select(error => error.Description)
            });
        }

        var roleResult = await _userManager.AddToRoleAsync(user, role);
        if (!roleResult.Succeeded)
        {
            await _userManager.DeleteAsync(user);
            return BadRequest(new
            {
                message = "The selected role could not be assigned.",
                errors = roleResult.Errors.Select(error => error.Description)
            });
        }

        return CreatedAtAction(nameof(GetUsers), ToResponse(user, role));
    }

    [HttpPut("{userId}/role")]
    [Authorize(Roles = RoleNames.Admin)]
    public async Task<ActionResult<AdminUserResponse>> UpdateRole(
        string userId,
        UpdateUserRoleRequest request)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return NotFound(new { message = "User not found." });
        }

        var role = request.Role.Trim();
        if (!await _roleManager.RoleExistsAsync(role))
        {
            return BadRequest(new { message = "The selected role is invalid." });
        }

        var currentRoles = await _userManager.GetRolesAsync(user);
        if (currentRoles.Count == 1 && currentRoles[0] == role)
        {
            return Ok(ToResponse(user, role));
        }

        if (currentRoles.Count > 0)
        {
            var removeResult = await _userManager.RemoveFromRolesAsync(user, currentRoles);
            if (!removeResult.Succeeded)
            {
                return BadRequest(new { message = "The current role could not be removed." });
            }
        }

        var addResult = await _userManager.AddToRoleAsync(user, role);
        if (!addResult.Succeeded)
        {
            if (currentRoles.Count > 0)
            {
                await _userManager.AddToRolesAsync(user, currentRoles);
            }

            return BadRequest(new { message = "The new role could not be assigned." });
        }

        return Ok(ToResponse(user, role));
    }

    [HttpDelete("{userId}")]
    [Authorize(Roles = RoleNames.Admin)]
    public async Task<IActionResult> DeleteUser(string userId)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == currentUserId)
        {
            return BadRequest(new { message = "You cannot delete your own account." });
        }

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return NotFound(new { message = "User not found." });
        }

        if (await _userManager.IsInRoleAsync(user, RoleNames.Admin))
        {
            var administrators = await _userManager.GetUsersInRoleAsync(RoleNames.Admin);
            if (administrators.Count <= 1)
            {
                return BadRequest(new { message = "The last administrator account cannot be deleted." });
            }
        }

        try
        {
            var result = await _userManager.DeleteAsync(user);
            if (!result.Succeeded)
            {
                return BadRequest(new
                {
                    message = "The user could not be deleted.",
                    errors = result.Errors.Select(error => error.Description)
                });
            }
        }
        catch (DbUpdateException)
        {
            return Conflict(new
            {
                message = "This user cannot be deleted because tickets or activity records still reference the account."
            });
        }

        return NoContent();
    }

    private static AdminUserResponse ToResponse(ApplicationUser user, string? role) => new()
    {
        Id = user.Id,
        FullName = user.FullName,
        Email = user.Email ?? string.Empty,
        Role = role ?? string.Empty,
        CreatedAt = user.CreatedDate
    };
}
