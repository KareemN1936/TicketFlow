# Email Debugging Guide

## Changes Made

1. **Frontend ForgotPassword.jsx** - Completely replaced with simplified API-calling version:
   - ✅ No verification code displayed on website anymore
   - ✅ Only shows email input field
   - ✅ Calls real backend API: `POST http://localhost:5215/api/auth/forgot-password`
   - ✅ Shows "Check your email" message after submission

2. **Backend Improvements**:
   - ✅ Added detailed SMTP logging to trace exact connection point of failure
   - ✅ Better error messages in 500 responses
   - ✅ Test user auto-seeding: `test@example.com` / `TestPassword123!`
   - ✅ All configuration values now trimmed (removes whitespace issues)

## Why Email Isn't Being Sent - Likely Causes

The most common reasons Gmail SMTP fails:
1. **App Password incorrect or has spaces** 
2. **2-Factor Authentication not enabled on Gmail account**
3. **App Passwords not generated/enabled in Gmail security settings**
4. **Firewall/Antivirus blocking port 587**
5. **Gmail account locked due to suspicious activity**

## Testing Steps

### Step 1: Start Backend and Check Logs
```bash
cd backend/TicketFlow.API
dotnet run
```
**Look for these logs:**
- "Now listening on: http://localhost:5215" - Backend running ✓
- "Test user seeding" messages in logs

### Step 2: Test Forgot-Password with Test User
Using PowerShell:
```powershell
$body = '{"email":"test@example.com"}'
$response = Invoke-WebRequest -Uri "http://localhost:5215/api/auth/forgot-password" `
  -Method POST -ContentType "application/json" -Body $body -UseBasicParsing

$response.StatusCode
$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

**Expected Results:**
- **Status 200**: Look for error message in response JSON (e.g., "SMTP authentication failed")
- **Status 500**: Error is in the response message

### Step 3: Check Backend Console for Detailed Logs
When you run the endpoint, you should see logs like:
```
info: TicketFlow.API.Services.EmailService[0]
      Starting to send email to test@example.com
info: TicketFlow.API.Services.EmailService[0]
      Connecting to SMTP server smtp.gmail.com:587
info: TicketFlow.API.Services.EmailService[0]
      Connected to SMTP server successfully
info: TicketFlow.API.Services.EmailService[0]
      Authenticated with SMTP server
...
```

**If you see an error**, it will be logged as:
```
fail: TicketFlow.API.Services.EmailService[0]
      Failed to send email to test@example.com. Error: [SPECIFIC ERROR MESSAGE]
```

### Step 4: Verify Gmail Settings

1. **Check 2-Factor Authentication is ENABLED:**
   - Go to https://myaccount.google.com/
   - Click "Security" on left
   - Scroll to "2-Step Verification"
   - Make sure it's ON

2. **Verify App Password exists:**
   - Still in Security settings
   - Look for "App passwords" (only appears if 2FA is enabled)
   - Create one for "Mail" and "Windows Computer" if you haven't
   - **DO NOT use your account password** - only use the 16-character app password

3. **Check for account lock:**
   - Try logging in to https://gmail.com manually
   - If locked, click "Yes, that's me" to unlock
   - Check email for security alerts

### Step 5: Test Your Specific Email

Once you verify the test user works, try:
```powershell
# Try with YOUR email (that's registered in the system)
$body = '{"email":"your-registered-email@gmail.com"}'
$response = Invoke-WebRequest -Uri "http://localhost:5215/api/auth/forgot-password" `
  -Method POST -ContentType "application/json" -Body $body -UseBasicParsing

# Check response
$response.Content
```

## If Still Not Working

1. **Check Gmail's "Less secure app access" is OFF** (you should be using App Password with 2FA instead)
2. **Verify network connectivity** to smtp.gmail.com:
   ```powershell
   Test-NetConnection -ComputerName smtp.gmail.com -Port 587
   ```
3. **Try a different email service** (temporary testing) - contact me for alternative SMTP provider

## What the Frontend Does Now

```
User enters email and clicks "Send reset link"
    ↓
Frontend calls: POST http://localhost:5215/api/auth/forgot-password
    ↓
Backend:
  1. Looks up user by email
  2. Generates password reset token
  3. URL-encodes token
  4. Builds reset link: http://localhost:5173/reset-password?email=...&token=...
  5. Generates HTML email with TicketFlow branding
  6. Sends via SMTP (THIS IS WHERE IT FAILS)
  7. Returns generic "If this email exists..." message
    ↓
User sees "Check your email" message
```

NO verification codes are shown on the website anymore. Everything is handled via email link.
