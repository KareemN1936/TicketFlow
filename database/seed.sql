-- ============================================================
-- Roles
-- ============================================================

INSERT INTO dbo.Role (RoleName, Description)
VALUES
('Admin', 'Full system access'),
('IT Support Agent', 'Manage and resolve tickets'),
('Employee', 'Create and track tickets'),
('Manager', 'Monitor team tickets and reports');
GO

-- ============================================================
-- Departments
-- ============================================================

INSERT INTO dbo.Department (DepartmentName, Description)
VALUES
('IT', 'Information technology department'),
('Human Resources', 'Human resources department'),
('Finance', 'Finance and accounting department'),
('Operations', 'Operations department'),
('Sales', 'Sales department');
GO

-- ============================================================
-- Categories
-- ============================================================

INSERT INTO dbo.Category (CategoryName, Description)
VALUES
('Hardware', 'Hardware related issues'),
('Software', 'Software related issues'),
('Network', 'Network and connectivity issues'),
('Email', 'Email and mailbox issues'),
('Access Request', 'Account access and permission requests'),
('Other', 'Other support requests');
GO

-- ============================================================
-- Priorities
-- ============================================================

INSERT INTO dbo.Priority (PriorityName, PriorityLevel, Description)
VALUES
('Low', 1, 'Low urgency issue'),
('Medium', 2, 'Normal priority issue'),
('High', 3, 'Important issue requiring quick response'),
('Critical', 4, 'Critical issue affecting business operations');
GO

-- ============================================================
-- Statuses
-- ============================================================

INSERT INTO dbo.Status (StatusName, Description)
VALUES
('Open', 'Ticket has been submitted'),
('In Progress', 'Ticket is being worked on'),
('Pending', 'Waiting for more information or action'),
('Resolved', 'Issue has been resolved'),
('Closed', 'Ticket has been closed');
GO

-- ============================================================
-- Users
-- PasswordHash values are placeholders for documentation/demo.
-- In a real system, passwords must be securely hashed.
-- ============================================================

INSERT INTO dbo.[User]
(
    RoleId,
    DepartmentId,
    FullName,
    Email,
    PasswordHash,
    PhoneNumber,
    JobTitle
)
VALUES
(1, 1, 'System Admin', 'admin@helpdesk.com', 'hashed_password_placeholder', '70000001', 'System Administrator'),
(2, 1, 'Nour Haddad', 'nour.agent@helpdesk.com', 'hashed_password_placeholder', '70000002', 'IT Support Agent'),
(2, 1, 'Karim Mansour', 'karim.agent@helpdesk.com', 'hashed_password_placeholder', '70000003', 'IT Support Agent'),
(3, 2, 'Maya Saad', 'maya.employee@company.com', 'hashed_password_placeholder', '70000004', 'HR Employee'),
(3, 3, 'Omar Nasser', 'omar.employee@company.com', 'hashed_password_placeholder', '70000005', 'Finance Employee'),
(4, 4, 'Lea Khoury', 'lea.manager@company.com', 'hashed_password_placeholder', '70000006', 'Operations Manager');
GO

-- ============================================================
-- Tickets
-- ============================================================

INSERT INTO dbo.Ticket
(
    CreatedByUserId,
    CategoryId,
    PriorityId,
    StatusId,
    TicketNumber,
    Title,
    Description,
    DueDate
)
VALUES
(4, 4, 2, 1, 'TCK-0001', 'Outlook not opening', 'Microsoft Outlook does not open on the employee laptop.', DATEADD(DAY, 3, SYSDATETIME())),
(5, 1, 3, 2, 'TCK-0002', 'Laptop overheating', 'The laptop fan is very loud and the device becomes hot quickly.', DATEADD(DAY, 2, SYSDATETIME())),
(4, 5, 2, 3, 'TCK-0003', 'Need access to payroll folder', 'Employee needs access permission to the payroll shared folder.', DATEADD(DAY, 5, SYSDATETIME())),
(6, 3, 4, 1, 'TCK-0004', 'Wi-Fi is down in operations office', 'The operations office has no Wi-Fi connectivity.', DATEADD(DAY, 1, SYSDATETIME()));
GO

-- ============================================================
-- Ticket Assignments
-- ============================================================

INSERT INTO dbo.TicketAssignment
(
    TicketId,
    AssignedToUserId,
    AssignedByUserId,
    AssignmentReason
)
VALUES
(1, 2, 1, 'Assigned to email/software support agent'),
(2, 3, 1, 'Assigned to hardware support agent'),
(3, 2, 1, 'Assigned to access request support agent'),
(4, 3, 1, 'Assigned to network support agent');
GO

-- ============================================================
-- Ticket Comments
-- ============================================================

INSERT INTO dbo.TicketComment
(
    TicketId,
    UserId,
    CommentText,
    IsInternal
)
VALUES
(1, 2, 'Please restart Outlook and confirm if the issue continues.', 0),
(2, 3, 'Internal note: possible dust buildup or battery issue.', 1),
(3, 2, 'Access request received. Waiting for manager approval.', 0),
(4, 3, 'Network outage is being checked by IT support.', 0);
GO

-- ============================================================
-- Ticket Attachments
-- ============================================================

INSERT INTO dbo.TicketAttachment
(
    TicketId,
    UploadedByUserId,
    FileName,
    StoredFileName,
    FilePath,
    FileType,
    FileSizeBytes
)
VALUES
(1, 4, 'outlook-error.png', 'TCK0001_outlook_error.png', '/uploads/tickets/TCK0001/outlook-error.png', 'image/png', 245000),
(2, 5, 'laptop-temperature.jpg', 'TCK0002_laptop_temperature.jpg', '/uploads/tickets/TCK0002/laptop-temperature.jpg', 'image/jpeg', 320000);
GO

-- ============================================================
-- Ticket History
-- ============================================================

INSERT INTO dbo.TicketHistory
(
    TicketId,
    ChangedByUserId,
    FieldName,
    OldValue,
    NewValue,
    ChangeReason
)
VALUES
(1, 1, 'Status', NULL, 'Open', 'Ticket created'),
(2, 1, 'Status', 'Open', 'In Progress', 'Agent started working on ticket'),
(3, 2, 'Status', 'Open', 'Pending', 'Waiting for approval'),
(4, 1, 'Priority', 'High', 'Critical', 'Network outage affects office operations');
GO

-- ============================================================
-- Notifications
-- ============================================================

INSERT INTO dbo.Notification
(
    UserId,
    TicketId,
    NotificationTitle,
    NotificationMessage,
    NotificationType
)
VALUES
(4, 1, 'Ticket Created', 'Your ticket TCK-0001 has been created.', 'Ticket'),
(5, 2, 'Ticket Updated', 'Your ticket TCK-0002 is now in progress.', 'Ticket'),
(2, 3, 'New Assignment', 'Ticket TCK-0003 has been assigned to you.', 'Assignment'),
(3, 4, 'Critical Ticket Assigned', 'Critical ticket TCK-0004 has been assigned to you.', 'Assignment');
GO

-- ============================================================
-- Activity Logs
-- ============================================================

INSERT INTO dbo.ActivityLog
(
    UserId,
    ActionType,
    EntityName,
    EntityId,
    Description,
    IpAddress
)
VALUES
(1, 'Create', 'User', 2, 'Admin created IT support agent account.', '127.0.0.1'),
(4, 'Create', 'Ticket', 1, 'Employee created ticket TCK-0001.', '127.0.0.1'),
(1, 'Assign', 'TicketAssignment', 1, 'Admin assigned ticket TCK-0001 to support agent.', '127.0.0.1'),
(3, 'Update', 'Ticket', 4, 'Support agent started reviewing network outage ticket.', '127.0.0.1');
GO