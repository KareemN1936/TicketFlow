using TicketFlow.API.DTOs;
using TicketFlow.API.Helpers;
using TicketFlow.API.Models;
using TicketFlow.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Web;

namespace TicketFlow.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly JwtService _jwtService;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _configuration;

    public AuthController(UserManager<ApplicationUser> userManager, JwtService jwtService, IEmailService emailService, IConfiguration configuration)
    {
        _userManager = userManager;
        _jwtService = jwtService;
        _emailService = emailService;
        _configuration = configuration;
    }

    [Authorize(Roles = RoleNames.Admin)]
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        var existingUser = await _userManager.FindByEmailAsync(request.Email);

        if (existingUser != null)
        {
            return BadRequest(new { message = "Email is already registered." });
        }

        var user = new ApplicationUser
        {
            FullName = request.FullName,
            UserName = request.Email,
            Email = request.Email
        };

        var result = await _userManager.CreateAsync(user, request.Password);

        if (!result.Succeeded)
        {
            return BadRequest(result.Errors);
        }

        await _userManager.AddToRoleAsync(user, RoleNames.Employee);

        return Ok(new { message = "User registered successfully." });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);

        if (user == null)
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }

        var isPasswordValid = await _userManager.CheckPasswordAsync(user, request.Password);

        if (!isPasswordValid)
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }

        var token = await _jwtService.GenerateTokenAsync(user);
        var roles = await _userManager.GetRolesAsync(user);

        return Ok(new AuthResponse
        {
            Token = token,
            Email = user.Email ?? string.Empty,
            FullName = user.FullName,
            Roles = roles
        });
    }

    [Authorize]
    [HttpGet("me")]
    public IActionResult Me()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var email = User.FindFirstValue(ClaimTypes.Email);
        var fullName = User.FindFirstValue(ClaimTypes.Name);
        var roles = User.FindAll(ClaimTypes.Role).Select(role => role.Value).ToList();

        return Ok(new
        {
            userId,
            email,
            fullName,
            roles
        });
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(ForgotPasswordRequest request)
    {
        var email = request.Email.Trim();
        var user = await _userManager.FindByEmailAsync(email);

        if (user == null)
        {
            return NotFound(new { message = "No account exists with this email address." });
        }

        try
        {
            // Generate password reset token
            var token = await _userManager.GeneratePasswordResetTokenAsync(user);

            // URL encode the token for safe transmission in URL
            var encodedToken = HttpUtility.UrlEncode(token);

            // Get frontend base URL from configuration
            var frontendBaseUrl = _configuration["FrontendBaseUrl"] ?? "http://localhost:5173";

            // Build reset password link
            var resetLink = $"{frontendBaseUrl}/reset-password?email={HttpUtility.UrlEncode(user.Email ?? string.Empty)}&token={encodedToken}";

            // Generate email content
            var emailContent = EmailTemplates.GeneratePasswordResetEmail(resetLink, user.FullName);

            // Send email
            await _emailService.SendEmailAsync(user.Email ?? string.Empty, "Password Reset Request - TicketFlow", emailContent);

            return Ok(new { message = "A password reset link has been sent." });
        }
        catch (Exception ex)
        {
            // Log error but still return generic success response
            return StatusCode(500, new { message = "An error occurred while sending the email. Please try again later.", error = ex.Message });
        }
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(ResetPasswordRequest request)
    {
        if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Token) || string.IsNullOrEmpty(request.NewPassword))
        {
            return BadRequest(new { message = "Email, token, and new password are required." });
        }

        var user = await _userManager.FindByEmailAsync(request.Email);

        if (user == null)
        {
            return BadRequest(new { message = "Invalid email address." });
        }

        // The token is already decoded by the browser when retrieved from the query string.
        var result = await _userManager.ResetPasswordAsync(user, request.Token, request.NewPassword);

        if (!result.Succeeded)
        {
            return BadRequest(new { message = "Password reset failed. The reset link may have expired.", errors = result.Errors.Select(e => e.Description) });
        }

        return Ok(new { message = "Password has been reset successfully. You can now log in with your new password." });
    }
}
