-- ============================================================
-- 1. Role
-- ============================================================

CREATE TABLE dbo.Role
(
    RoleId INT IDENTITY(1,1) NOT NULL,
    RoleName VARCHAR(50) NOT NULL,
    Description VARCHAR(255) NULL,
    CreatedDate DATETIME2 NOT NULL
        CONSTRAINT DfRole_CreatedDate DEFAULT SYSDATETIME(),

    CONSTRAINT PkRole_RoleId PRIMARY KEY (RoleId),
    CONSTRAINT UnRole_RoleName UNIQUE (RoleName)
);
GO

-- ============================================================
-- 2. Department
-- ============================================================

CREATE TABLE dbo.Department
(
    DepartmentId INT IDENTITY(1,1) NOT NULL,
    DepartmentName VARCHAR(100) NOT NULL,
    Description VARCHAR(255) NULL,
    IsActive BIT NOT NULL
        CONSTRAINT DfDepartment_IsActive DEFAULT 1,
    CreatedDate DATETIME2 NOT NULL
        CONSTRAINT DfDepartment_CreatedDate DEFAULT SYSDATETIME(),

    CONSTRAINT PkDepartment_DepartmentId PRIMARY KEY (DepartmentId),
    CONSTRAINT UnDepartment_DepartmentName UNIQUE (DepartmentName)
);
GO

-- ============================================================
-- 3. Category
-- ============================================================

CREATE TABLE dbo.Category
(
    CategoryId INT IDENTITY(1,1) NOT NULL,
    CategoryName VARCHAR(100) NOT NULL,
    Description VARCHAR(255) NULL,
    IsActive BIT NOT NULL
        CONSTRAINT DfCategory_IsActive DEFAULT 1,
    CreatedDate DATETIME2 NOT NULL
        CONSTRAINT DfCategory_CreatedDate DEFAULT SYSDATETIME(),

    CONSTRAINT PkCategory_CategoryId PRIMARY KEY (CategoryId),
    CONSTRAINT UnCategory_CategoryName UNIQUE (CategoryName)
);
GO

-- ============================================================
-- 4. Priority
-- ============================================================

CREATE TABLE dbo.Priority
(
    PriorityId INT IDENTITY(1,1) NOT NULL,
    PriorityName VARCHAR(50) NOT NULL,
    PriorityLevel INT NOT NULL,
    Description VARCHAR(255) NULL,
    CreatedDate DATETIME2 NOT NULL
        CONSTRAINT DfPriority_CreatedDate DEFAULT SYSDATETIME(),

    CONSTRAINT PkPriority_PriorityId PRIMARY KEY (PriorityId),
    CONSTRAINT UnPriority_PriorityName UNIQUE (PriorityName),
    CONSTRAINT CkPriority_PriorityLevel CHECK (PriorityLevel BETWEEN 1 AND 4)
);
GO

-- ============================================================
-- 5. Status
-- ============================================================

CREATE TABLE dbo.Status
(
    StatusId INT IDENTITY(1,1) NOT NULL,
    StatusName VARCHAR(50) NOT NULL,
    Description VARCHAR(255) NULL,
    CreatedDate DATETIME2 NOT NULL
        CONSTRAINT DfStatus_CreatedDate DEFAULT SYSDATETIME(),

    CONSTRAINT PkStatus_StatusId PRIMARY KEY (StatusId),
    CONSTRAINT UnStatus_StatusName UNIQUE (StatusName)
);
GO

-- ============================================================
-- 6. User
-- Brackets are used because User can conflict with SQL Server terms.
-- ============================================================

CREATE TABLE dbo.[User]
(
    UserId INT IDENTITY(1,1) NOT NULL,
    RoleId INT NOT NULL,
    DepartmentId INT NULL,
    FullName VARCHAR(150) NOT NULL,
    Email VARCHAR(150) NOT NULL,
    PasswordHash VARCHAR(255) NOT NULL,
    PhoneNumber VARCHAR(30) NULL,
    JobTitle VARCHAR(100) NULL,
    IsActive BIT NOT NULL
        CONSTRAINT DfUser_IsActive DEFAULT 1,
    LastLoginDate DATETIME2 NULL,
    CreatedDate DATETIME2 NOT NULL
        CONSTRAINT DfUser_CreatedDate DEFAULT SYSDATETIME(),
    UpdatedDate DATETIME2 NULL,

    CONSTRAINT PkUser_UserId PRIMARY KEY (UserId),
    CONSTRAINT UnUser_Email UNIQUE (Email),

    CONSTRAINT FkUser_RoleId FOREIGN KEY (RoleId)
        REFERENCES dbo.Role (RoleId),

    CONSTRAINT FkUser_DepartmentId FOREIGN KEY (DepartmentId)
        REFERENCES dbo.Department (DepartmentId)
);
GO

-- ============================================================
-- 7. Ticket
-- ============================================================

CREATE TABLE dbo.Ticket
(
    TicketId INT IDENTITY(1,1) NOT NULL,
    CreatedByUserId INT NOT NULL,
    CategoryId INT NOT NULL,
    PriorityId INT NOT NULL,
    StatusId INT NOT NULL,
    TicketNumber VARCHAR(30) NOT NULL,
    Title VARCHAR(150) NOT NULL,
    Description VARCHAR(MAX) NOT NULL,
    ResolutionSummary VARCHAR(MAX) NULL,
    CreatedDate DATETIME2 NOT NULL
        CONSTRAINT DfTicket_CreatedDate DEFAULT SYSDATETIME(),
    UpdatedDate DATETIME2 NULL,
    ResolvedDate DATETIME2 NULL,
    ClosedDate DATETIME2 NULL,
    DueDate DATETIME2 NULL,
    IsDeleted BIT NOT NULL
        CONSTRAINT DfTicket_IsDeleted DEFAULT 0,

    CONSTRAINT PkTicket_TicketId PRIMARY KEY (TicketId),
    CONSTRAINT UnTicket_TicketNumber UNIQUE (TicketNumber),

    CONSTRAINT FkTicket_CreatedByUserId FOREIGN KEY (CreatedByUserId)
        REFERENCES dbo.[User] (UserId),

    CONSTRAINT FkTicket_CategoryId FOREIGN KEY (CategoryId)
        REFERENCES dbo.Category (CategoryId),

    CONSTRAINT FkTicket_PriorityId FOREIGN KEY (PriorityId)
        REFERENCES dbo.Priority (PriorityId),

    CONSTRAINT FkTicket_StatusId FOREIGN KEY (StatusId)
        REFERENCES dbo.Status (StatusId)
);
GO

-- ============================================================
-- 8. TicketAssignment
-- ============================================================

CREATE TABLE dbo.TicketAssignment
(
    TicketAssignmentId INT IDENTITY(1,1) NOT NULL,
    TicketId INT NOT NULL,
    AssignedToUserId INT NOT NULL,
    AssignedByUserId INT NOT NULL,
    AssignedDate DATETIME2 NOT NULL
        CONSTRAINT DfTicketAssignment_AssignedDate DEFAULT SYSDATETIME(),
    UnassignedDate DATETIME2 NULL,
    AssignmentReason VARCHAR(255) NULL,
    IsCurrent BIT NOT NULL
        CONSTRAINT DfTicketAssignment_IsCurrent DEFAULT 1,

    CONSTRAINT PkTicketAssignment_TicketAssignmentId PRIMARY KEY (TicketAssignmentId),

    CONSTRAINT FkTicketAssignment_TicketId FOREIGN KEY (TicketId)
        REFERENCES dbo.Ticket (TicketId),

    CONSTRAINT FkTicketAssignment_AssignedToUserId FOREIGN KEY (AssignedToUserId)
        REFERENCES dbo.[User] (UserId),

    CONSTRAINT FkTicketAssignment_AssignedByUserId FOREIGN KEY (AssignedByUserId)
        REFERENCES dbo.[User] (UserId)
);
GO

-- ============================================================
-- 9. TicketComment
-- ============================================================

CREATE TABLE dbo.TicketComment
(
    TicketCommentId INT IDENTITY(1,1) NOT NULL,
    TicketId INT NOT NULL,
    UserId INT NOT NULL,
    CommentText VARCHAR(MAX) NOT NULL,
    IsInternal BIT NOT NULL
        CONSTRAINT DfTicketComment_IsInternal DEFAULT 0,
    CreatedDate DATETIME2 NOT NULL
        CONSTRAINT DfTicketComment_CreatedDate DEFAULT SYSDATETIME(),
    UpdatedDate DATETIME2 NULL,

    CONSTRAINT PkTicketComment_TicketCommentId PRIMARY KEY (TicketCommentId),

    CONSTRAINT FkTicketComment_TicketId FOREIGN KEY (TicketId)
        REFERENCES dbo.Ticket (TicketId),

    CONSTRAINT FkTicketComment_UserId FOREIGN KEY (UserId)
        REFERENCES dbo.[User] (UserId)
);
GO

-- ============================================================
-- 10. TicketAttachment
-- ============================================================

CREATE TABLE dbo.TicketAttachment
(
    TicketAttachmentId INT IDENTITY(1,1) NOT NULL,
    TicketId INT NOT NULL,
    UploadedByUserId INT NOT NULL,
    FileName VARCHAR(255) NOT NULL,
    StoredFileName VARCHAR(255) NOT NULL,
    FilePath VARCHAR(500) NOT NULL,
    FileType VARCHAR(50) NOT NULL,
    FileSizeBytes INT NOT NULL,
    UploadedDate DATETIME2 NOT NULL
        CONSTRAINT DfTicketAttachment_UploadedDate DEFAULT SYSDATETIME(),
    IsDeleted BIT NOT NULL
        CONSTRAINT DfTicketAttachment_IsDeleted DEFAULT 0,

    CONSTRAINT PkTicketAttachment_TicketAttachmentId PRIMARY KEY (TicketAttachmentId),

    CONSTRAINT FkTicketAttachment_TicketId FOREIGN KEY (TicketId)
        REFERENCES dbo.Ticket (TicketId),

    CONSTRAINT FkTicketAttachment_UploadedByUserId FOREIGN KEY (UploadedByUserId)
        REFERENCES dbo.[User] (UserId),

    CONSTRAINT CkTicketAttachment_FileSizeBytes CHECK (FileSizeBytes > 0)
);
GO

-- ============================================================
-- 11. TicketHistory
-- ============================================================

CREATE TABLE dbo.TicketHistory
(
    TicketHistoryId INT IDENTITY(1,1) NOT NULL,
    TicketId INT NOT NULL,
    ChangedByUserId INT NOT NULL,
    FieldName VARCHAR(100) NOT NULL,
    OldValue VARCHAR(500) NULL,
    NewValue VARCHAR(500) NULL,
    ChangeReason VARCHAR(255) NULL,
    CreatedDate DATETIME2 NOT NULL
        CONSTRAINT DfTicketHistory_CreatedDate DEFAULT SYSDATETIME(),

    CONSTRAINT PkTicketHistory_TicketHistoryId PRIMARY KEY (TicketHistoryId),

    CONSTRAINT FkTicketHistory_TicketId FOREIGN KEY (TicketId)
        REFERENCES dbo.Ticket (TicketId),

    CONSTRAINT FkTicketHistory_ChangedByUserId FOREIGN KEY (ChangedByUserId)
        REFERENCES dbo.[User] (UserId)
);
GO

-- ============================================================
-- 12. Notification
-- ============================================================

CREATE TABLE dbo.Notification
(
    NotificationId INT IDENTITY(1,1) NOT NULL,
    UserId INT NOT NULL,
    TicketId INT NULL,
    NotificationTitle VARCHAR(150) NOT NULL,
    NotificationMessage VARCHAR(500) NOT NULL,
    NotificationType VARCHAR(50) NOT NULL,
    IsRead BIT NOT NULL
        CONSTRAINT DfNotification_IsRead DEFAULT 0,
    CreatedDate DATETIME2 NOT NULL
        CONSTRAINT DfNotification_CreatedDate DEFAULT SYSDATETIME(),
    ReadDate DATETIME2 NULL,

    CONSTRAINT PkNotification_NotificationId PRIMARY KEY (NotificationId),

    CONSTRAINT FkNotification_UserId FOREIGN KEY (UserId)
        REFERENCES dbo.[User] (UserId),

    CONSTRAINT FkNotification_TicketId FOREIGN KEY (TicketId)
        REFERENCES dbo.Ticket (TicketId)
);
GO

-- ============================================================
-- 13. ActivityLog
-- ============================================================

CREATE TABLE dbo.ActivityLog
(
    ActivityLogId INT IDENTITY(1,1) NOT NULL,
    UserId INT NULL,
    ActionType VARCHAR(100) NOT NULL,
    EntityName VARCHAR(100) NOT NULL,
    EntityId INT NULL,
    Description VARCHAR(500) NULL,
    IpAddress VARCHAR(45) NULL,
    CreatedDate DATETIME2 NOT NULL
        CONSTRAINT DfActivityLog_CreatedDate DEFAULT SYSDATETIME(),

    CONSTRAINT PkActivityLog_ActivityLogId PRIMARY KEY (ActivityLogId),

    CONSTRAINT FkActivityLog_UserId FOREIGN KEY (UserId)
        REFERENCES dbo.[User] (UserId)
);
GO

-- ============================================================
-- Verify created tables
-- ============================================================

SELECT
    TABLE_SCHEMA,
    TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;
GO