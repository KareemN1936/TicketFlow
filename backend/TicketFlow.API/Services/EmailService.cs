using TicketFlow.API.Models;
using MailKit.Net.Smtp;
using MimeKit;

namespace TicketFlow.API.Services;

public interface IEmailService
{
    Task SendEmailAsync(string recipientEmail, string subject, string htmlContent);
}

public class EmailService : IEmailService
{
    private readonly EmailSettings _emailSettings;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _logger = logger;
        
        var emailSettings = new EmailSettings
        {
            SmtpServer = (configuration["EmailSettings:SmtpServer"] ?? throw new InvalidOperationException("SmtpServer not configured")).Trim(),
            SmtpPort = int.Parse(configuration["EmailSettings:SmtpPort"] ?? "587"),
            SenderName = (configuration["EmailSettings:SenderName"] ?? throw new InvalidOperationException("SenderName not configured")).Trim(),
            SenderEmail = (configuration["EmailSettings:SenderEmail"] ?? throw new InvalidOperationException("SenderEmail not configured")).Trim(),
            Username = (configuration["EmailSettings:Username"] ?? throw new InvalidOperationException("Username not configured")).Trim(),
            Password = (configuration["EmailSettings:Password"] ?? throw new InvalidOperationException("Password not configured")).Trim()
        };

        _emailSettings = emailSettings;
    }

    public async Task SendEmailAsync(string recipientEmail, string subject, string htmlContent)
    {
        try
        {
            _logger.LogInformation("Starting to send email to {RecipientEmail}", recipientEmail);

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_emailSettings.SenderName, _emailSettings.SenderEmail));
            message.To.Add(new MailboxAddress("", recipientEmail));
            message.Subject = subject;

            var bodyBuilder = new BodyBuilder
            {
                HtmlBody = htmlContent
            };

            message.Body = bodyBuilder.ToMessageBody();

            _logger.LogInformation("Connecting to SMTP server {SmtpServer}:{SmtpPort}", _emailSettings.SmtpServer, _emailSettings.SmtpPort);

            using (var client = new SmtpClient())
            {
                await client.ConnectAsync(_emailSettings.SmtpServer, _emailSettings.SmtpPort, MailKit.Security.SecureSocketOptions.StartTls);
                _logger.LogInformation("Connected to SMTP server successfully");

                await client.AuthenticateAsync(_emailSettings.Username, _emailSettings.Password);
                _logger.LogInformation("Authenticated with SMTP server");

                await client.SendAsync(message);
                _logger.LogInformation("Email sent successfully");

                await client.DisconnectAsync(true);
                _logger.LogInformation("Disconnected from SMTP server");
            }

            _logger.LogInformation("Email sent successfully to {RecipientEmail}", recipientEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {RecipientEmail}. Error: {ErrorMessage}", recipientEmail, ex.Message);
            throw;
        }
    }
}
