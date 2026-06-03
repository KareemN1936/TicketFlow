namespace TicketFlow.API.Helpers;

public static class EmailTemplates
{
    public static string GeneratePasswordResetEmail(string resetLink, string recipientName)
    {
        return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f9fafb;
            margin: 0;
            padding: 0;
        }}
        .email-container {{
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            overflow: hidden;
        }}
        .email-header {{
            background: linear-gradient(135deg, #0867ee 0%, #004ac6 100%);
            padding: 32px 20px;
            text-align: center;
        }}
        .email-logo {{
            max-width: 200px;
            margin: 0 auto;
        }}
        .email-logo img {{
            max-width: 100%;
            height: auto;
            display: block;
        }}
        .email-content {{
            padding: 40px 30px;
        }}
        .email-heading {{
            font-size: 24px;
            font-weight: 600;
            color: #0d1e4a;
            margin: 0 0 16px 0;
        }}
        .email-subheading {{
            font-size: 14px;
            color: #666;
            margin: 0 0 24px 0;
            line-height: 1.5;
        }}
        .email-text {{
            font-size: 14px;
            color: #555;
            margin-bottom: 24px;
            line-height: 1.6;
        }}
        .email-button {{
            display: inline-block;
            background: linear-gradient(135deg, #0867ee 0%, #004ac6 100%);
            color: #ffffff;
            padding: 12px 32px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            font-size: 15px;
            margin: 24px 0;
        }}
        .email-button:hover {{
            opacity: 0.9;
        }}
        .email-link {{
            word-break: break-all;
            color: #0867ee;
            font-size: 12px;
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid #e5e7eb;
        }}
        .email-footer {{
            background: #f3f4f6;
            padding: 24px 30px;
            font-size: 12px;
            color: #888;
            text-align: center;
            line-height: 1.5;
        }}
        .email-divider {{
            border-top: 1px solid #e5e7eb;
            margin: 24px 0;
        }}
    </style>
</head>
<body>
    <div class='email-container'>
        <div class='email-header'>
            <div class='email-logo'>
                <!-- Logo will be embedded or linked here -->
                <h2 style='color: white; margin: 0; font-size: 28px;'>TicketFlow</h2>
            </div>
        </div>
        
        <div class='email-content'>
            <h1 class='email-heading'>Reset Your Password</h1>
            <p class='email-subheading'>We received a request to reset your TicketFlow password.</p>
            
            <p class='email-text'>
                Click the button below to create a new password. This link will expire in 15 minutes.
            </p>
            
            <a href='{resetLink}' class='email-button' style='color: #ffffff !important; text-decoration: none !important; font-weight: 700;'>Reset Password</a>
            
            <p class='email-text'>
                Or copy and paste this link into your browser:
            </p>
            <p class='email-link'>
                {resetLink}
            </p>
            
            <div class='email-divider'></div>
            
            <p class='email-text'>
                If you did not request a password reset, please ignore this email or <a href='#' style='color: #0867ee; text-decoration: none;'>contact support</a>.
            </p>
            
            <p class='email-text'>
                Best regards,<br>
                <strong>TicketFlow Support Team</strong>
            </p>
        </div>
        
        <div class='email-footer'>
            <p style='margin: 0;'>
                TicketFlow - IT Support Platform<br>
                © 2026 All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
";
    }
}
