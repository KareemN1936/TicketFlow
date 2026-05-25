USE [IT Management System];
GO

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
-- ============================================================

DECLARE
    @AdminRoleId INT = (SELECT Id FROM dbo.Role WHERE RoleName = 'Admin'),
    @AgentRoleId INT = (SELECT Id FROM dbo.Role WHERE RoleName = 'IT Support Agent'),
    @EmployeeRoleId INT = (SELECT Id FROM dbo.Role WHERE RoleName = 'Employee'),
    @ManagerRoleId INT = (SELECT Id FROM dbo.Role WHERE RoleName = 'Manager'),

    @ItDepartmentId INT = (SELECT Id FROM dbo.Department WHERE DepartmentName = 'IT'),
    @HrDepartmentId INT = (SELECT Id FROM dbo.Department WHERE DepartmentName = 'Human Resources'),
    @FinanceDepartmentId INT = (SELECT Id FROM dbo.Department WHERE DepartmentName = 'Finance'),
    @OperationsDepartmentId INT = (SELECT Id FROM dbo.Department WHERE DepartmentName = 'Operations');

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
(@AdminRoleId, @ItDepartmentId, 'System Admin', 'admin@helpdesk.com', 'hashed_password_placeholder', '70000001', 'System Administrator'),
(@AgentRoleId, @ItDepartmentId, 'Nour Haddad', 'nour.agent@helpdesk.com', 'hashed_password_placeholder', '70000002', 'IT Support Agent'),
(@AgentRoleId, @ItDepartmentId, 'Karim Mansour', 'karim.agent@helpdesk.com', 'hashed_password_placeholder', '70000003', 'IT Support Agent'),
(@EmployeeRoleId, @HrDepartmentId, 'Maya Saad', 'maya.employee@company.com', 'hashed_password_placeholder', '70000004', 'HR Employee'),
(@EmployeeRoleId, @FinanceDepartmentId, 'Omar Nasser', 'omar.employee@company.com', 'hashed_password_placeholder', '70000005', 'Finance Employee'),
(@ManagerRoleId, @OperationsDepartmentId, 'Lea Khoury', 'lea.manager@company.com', 'hashed_password_placeholder', '70000006', 'Operations Manager');
GO

-- ============================================================
-- Tickets
-- ============================================================

DECLARE
    @EmailCategoryId INT = (SELECT Id FROM dbo.Category WHERE CategoryName = 'Email'),
    @HardwareCategoryId INT = (SELECT Id FROM dbo.Category WHERE CategoryName = 'Hardware'),
    @AccessRequestCategoryId INT = (SELECT Id FROM dbo.Category WHERE CategoryName = 'Access Request'),
    @NetworkCategoryId INT = (SELECT Id FROM dbo.Category WHERE CategoryName = 'Network'),

    @MediumPriorityId INT = (SELECT Id FROM dbo.Priority WHERE PriorityName = 'Medium'),
    @HighPriorityId INT = (SELECT Id FROM dbo.Priority WHERE PriorityName = 'High'),
    @CriticalPriorityId INT = (SELECT Id FROM dbo.Priority WHERE PriorityName = 'Critical'),

    @OpenStatusId INT = (SELECT Id FROM dbo.Status WHERE StatusName = 'Open'),
    @InProgressStatusId INT = (SELECT Id FROM dbo.Status WHERE StatusName = 'In Progress'),
    @PendingStatusId INT = (SELECT Id FROM dbo.Status WHERE StatusName = 'Pending'),

    @MayaUserId INT = (SELECT Id FROM dbo.[User] WHERE Email = 'maya.employee@company.com'),
    @OmarUserId INT = (SELECT Id FROM dbo.[User] WHERE Email = 'omar.employee@company.com'),
    @LeaUserId INT = (SELECT Id FROM dbo.[User] WHERE Email = 'lea.manager@company.com');

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
(@MayaUserId, @EmailCategoryId, @MediumPriorityId, @OpenStatusId, 'TCK-0001', 'Outlook not opening', 'Microsoft Outlook does not open on the employee laptop.', DATEADD(DAY, 3, SYSDATETIME())),
(@OmarUserId, @HardwareCategoryId, @HighPriorityId, @InProgressStatusId, 'TCK-0002', 'Laptop overheating', 'The laptop fan is very loud and the device becomes hot quickly.', DATEADD(DAY, 2, SYSDATETIME())),
(@MayaUserId, @AccessRequestCategoryId, @MediumPriorityId, @PendingStatusId, 'TCK-0003', 'Need access to payroll folder', 'Employee needs access permission to the payroll shared folder.', DATEADD(DAY, 5, SYSDATETIME())),
(@LeaUserId, @NetworkCategoryId, @CriticalPriorityId, @OpenStatusId, 'TCK-0004', 'Wi-Fi is down in operations office', 'The operations office has no Wi-Fi connectivity.', DATEADD(DAY, 1, SYSDATETIME()));
GO

-- ============================================================
-- Ticket Assignments
-- ============================================================

DECLARE
    @AdminUserId INT = (SELECT Id FROM dbo.[User] WHERE Email = 'admin@helpdesk.com'),
    @NourUserId INT = (SELECT Id FROM dbo.[User] WHERE Email = 'nour.agent@helpdesk.com'),
    @KarimUserId INT = (SELECT Id FROM dbo.[User] WHERE Email = 'karim.agent@helpdesk.com'),

    @Ticket1Id INT = (SELECT Id FROM dbo.Ticket WHERE TicketNumber = 'TCK-0001'),
    @Ticket2Id INT = (SELECT Id FROM dbo.Ticket WHERE TicketNumber = 'TCK-0002'),
    @Ticket3Id INT = (SELECT Id FROM dbo.Ticket WHERE TicketNumber = 'TCK-0003'),
    @Ticket4Id INT = (SELECT Id FROM dbo.Ticket WHERE TicketNumber = 'TCK-0004');

INSERT INTO dbo.TicketAssignment
(
    TicketId,
    AssignedToUserId,
    AssignedByUserId,
    AssignmentReason
)
VALUES
(@Ticket1Id, @NourUserId, @AdminUserId, 'Assigned to email/software support agent'),
(@Ticket2Id, @KarimUserId, @AdminUserId, 'Assigned to hardware support agent'),
(@Ticket3Id, @NourUserId, @AdminUserId, 'Assigned to access request support agent'),
(@Ticket4Id, @KarimUserId, @AdminUserId, 'Assigned to network support agent');
GO

-- ============================================================
-- Ticket Comments
-- ============================================================

DECLARE
    @NourUserId INT = (SELECT Id FROM dbo.[User] WHERE Email = 'nour.agent@helpdesk.com'),
    @KarimUserId INT = (SELECT Id FROM dbo.[User] WHERE Email = 'karim.agent@helpdesk.com'),

    @Ticket1Id INT = (SELECT Id FROM dbo.Ticket WHERE TicketNumber = 'TCK-0001'),
    @Ticket2Id INT = (SELECT Id FROM dbo.Ticket WHERE TicketNumber = 'TCK-0002'),
    @Ticket3Id INT = (SELECT Id FROM dbo.Ticket WHERE TicketNumber = 'TCK-0003'),
    @Ticket4Id INT = (SELECT Id FROM dbo.Ticket WHERE TicketNumber = 'TCK-0004');

INSERT INTO dbo.TicketComment
(
    TicketId,
    UserId,
    CommentText,
    IsInternal
)
VALUES
(@Ticket1Id, @NourUserId, 'Please restart Outlook and confirm if the issue continues.', 0),
(@Ticket2Id, @KarimUserId, 'Internal note: possible dust buildup or battery issue.', 1),
(@Ticket3Id, @NourUserId, 'Access request received. Waiting for manager approval.', 0),
(@Ticket4Id, @KarimUserId, 'Network outage is being checked by IT support.', 0);
GO

-- ============================================================
-- Ticket Attachments
-- ============================================================

DECLARE
    @MayaUserId INT = (SELECT Id FROM dbo.[User] WHERE Email = 'maya.employee@company.com'),
    @OmarUserId INT = (SELECT Id FROM dbo.[User] WHERE Email = 'omar.employee@company.com'),

    @Ticket1Id INT = (SELECT Id FROM dbo.Ticket WHERE TicketNumber = 'TCK-0001'),
    @Ticket2Id INT = (SELECT Id FROM dbo.Ticket WHERE TicketNumber = 'TCK-0002');

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
(@Ticket1Id, @MayaUserId, 'outlook-error.png', 'TCK0001_outlook_error.png', '/uploads/tickets/TCK0001/outlook-error.png', 'image/png', 245000),
(@Ticket2Id, @OmarUserId, 'laptop-temperature.jpg', 'TCK0002_laptop_temperature.jpg', '/uploads/tickets/TCK0002/laptop-temperature.jpg', 'image/jpeg', 320000);
GO

-- ============================================================
-- Ticket History
-- ============================================================

DECLARE
    @AdminUserId INT = (SELECT Id FROM dbo.[User] WHERE Email = 'admin@helpdesk.com'),
    @NourUserId INT = (SELECT Id FROM dbo.[User] WHERE Email = 'nour.agent@helpdesk.com'),

    @Ticket1Id INT = (SELECT Id FROM dbo.Ticket WHERE TicketNumber = 'TCK-0001'),
    @Ticket2Id INT = (SELECT Id FROM dbo.Ticket WHERE TicketNumber = 'TCK-0002'),
    @Ticket3Id INT = (SELECT Id FROM dbo.Ticket WHERE TicketNumber = 'TCK-0003'),
    @Ticket4Id INT = (SELECT Id FROM dbo.Ticket WHERE TicketNumber = 'TCK-0004');

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
(@Ticket1Id, @AdminUserId, 'Status', NULL, 'Open', 'Ticket created'),
(@Ticket2Id, @AdminUserId, 'Status', 'Open', 'In Progress', 'Agent started working on ticket'),
(@Ticket3Id, @NourUserId, 'Status', 'Open', 'Pending', 'Waiting for approval'),
(@Ticket4Id, @AdminUserId, 'Priority', 'High', 'Critical', 'Network outage affects office operations');
GO

-- ============================================================
-- Notifications
-- ============================================================

DECLARE
    @MayaUserId INT = (SELECT Id FROM dbo.[User] WHERE Email = 'maya.employee@company.com'),
    @OmarUserId INT = (SELECT Id FROM dbo.[User] WHERE Email = 'omar.employee@company.com'),
    @NourUserId INT = (SELECT Id FROM dbo.[User] WHERE Email = 'nour.agent@helpdesk.com'),
    @KarimUserId INT = (SELECT Id FROM dbo.[User] WHERE Email = 'karim.agent@helpdesk.com'),

    @Ticket1Id INT = (SELECT Id FROM dbo.Ticket WHERE TicketNumber = 'TCK-0001'),
    @Ticket2Id INT = (SELECT Id FROM dbo.Ticket WHERE TicketNumber = 'TCK-0002'),
    @Ticket3Id INT = (SELECT Id FROM dbo.Ticket WHERE TicketNumber = 'TCK-0003'),
    @Ticket4Id INT = (SELECT Id FROM dbo.Ticket WHERE TicketNumber = 'TCK-0004');

INSERT INTO dbo.Notification
(
    UserId,
    TicketId,
    NotificationTitle,
    NotificationMessage,
    NotificationType
)
VALUES
(@MayaUserId, @Ticket1Id, 'Ticket Created', 'Your ticket TCK-0001 has been created.', 'Ticket'),
(@OmarUserId, @Ticket2Id, 'Ticket Updated', 'Your ticket TCK-0002 is now in progress.', 'Ticket'),
(@NourUserId, @Ticket3Id, 'New Assignment', 'Ticket TCK-0003 has been assigned to you.', 'Assignment'),
(@KarimUserId, @Ticket4Id, 'Critical Ticket Assigned', 'Critical ticket TCK-0004 has been assigned to you.', 'Assignment');
GO

-- ============================================================
-- Activity Logs
-- ============================================================

DECLARE
    @AdminUserId INT = (SELECT Id FROM dbo.[User] WHERE Email = 'admin@helpdesk.com'),
    @MayaUserId INT = (SELECT Id FROM dbo.[User] WHERE Email = 'maya.employee@company.com'),
    @KarimUserId INT = (SELECT Id FROM dbo.[User] WHERE Email = 'karim.agent@helpdesk.com'),
    @NourUserId INT = (SELECT Id FROM dbo.[User] WHERE Email = 'nour.agent@helpdesk.com'),

    @Ticket1Id INT = (SELECT Id FROM dbo.Ticket WHERE TicketNumber = 'TCK-0001'),
    @Ticket4Id INT = (SELECT Id FROM dbo.Ticket WHERE TicketNumber = 'TCK-0004'),

    @TicketAssignment1Id INT =
    (
        SELECT TOP 1 Id
        FROM dbo.TicketAssignment
        WHERE TicketId = (SELECT Id FROM dbo.Ticket WHERE TicketNumber = 'TCK-0001')
        ORDER BY Id
    );

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
(@AdminUserId, 'Create', 'User', @NourUserId, 'Admin created IT support agent account.', '127.0.0.1'),
(@MayaUserId, 'Create', 'Ticket', @Ticket1Id, 'Employee created ticket TCK-0001.', '127.0.0.1'),
(@AdminUserId, 'Assign', 'TicketAssignment', @TicketAssignment1Id, 'Admin assigned ticket TCK-0001 to support agent.', '127.0.0.1'),
(@KarimUserId, 'Update', 'Ticket', @Ticket4Id, 'Support agent started reviewing network outage ticket.', '127.0.0.1');
GO

-- ============================================================
-- Verify inserted records
-- ============================================================

SELECT 'Role' AS TableName, COUNT(*) AS TotalRows FROM dbo.Role
UNION ALL SELECT 'Department', COUNT(*) FROM dbo.Department
UNION ALL SELECT 'Category', COUNT(*) FROM dbo.Category
UNION ALL SELECT 'Priority', COUNT(*) FROM dbo.Priority
UNION ALL SELECT 'Status', COUNT(*) FROM dbo.Status
UNION ALL SELECT 'User', COUNT(*) FROM dbo.[User]
UNION ALL SELECT 'Ticket', COUNT(*) FROM dbo.Ticket
UNION ALL SELECT 'TicketAssignment', COUNT(*) FROM dbo.TicketAssignment
UNION ALL SELECT 'TicketComment', COUNT(*) FROM dbo.TicketComment
UNION ALL SELECT 'TicketAttachment', COUNT(*) FROM dbo.TicketAttachment
UNION ALL SELECT 'TicketHistory', COUNT(*) FROM dbo.TicketHistory
UNION ALL SELECT 'Notification', COUNT(*) FROM dbo.Notification
UNION ALL SELECT 'ActivityLog', COUNT(*) FROM dbo.ActivityLog;
GO