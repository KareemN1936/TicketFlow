USE master;
GO

IF DB_ID('IT Management System') IS NOT NULL
BEGIN
    ALTER DATABASE [IT Management System] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE [IT Management System];
END
GO

CREATE DATABASE [IT Management System];
GO

USE [IT Management System];
GO
-- ============================================================
-- 1. Role
-- ============================================================

CREATE TABLE dbo.Role
(
    Id INT IDENTITY(1,1) NOT NULL,
    RoleName VARCHAR(50) NOT NULL,
    Description VARCHAR(255) NULL,
    CreatedDate DATETIME2 NOT NULL
        CONSTRAINT DfRole_CreatedDate DEFAULT SYSDATETIME(),

    CONSTRAINT PkRole_Id PRIMARY KEY (Id),
    CONSTRAINT UnRole_RoleName UNIQUE (RoleName)
);
GO

-- ============================================================
-- 2. Department
-- ============================================================

CREATE TABLE dbo.Department
(
    Id INT IDENTITY(1,1) NOT NULL,
    DepartmentName VARCHAR(100) NOT NULL,
    Description VARCHAR(255) NULL,
    IsActive BIT NOT NULL
        CONSTRAINT DfDepartment_IsActive DEFAULT 1,
    CreatedDate DATETIME2 NOT NULL
        CONSTRAINT DfDepartment_CreatedDate DEFAULT SYSDATETIME(),

    CONSTRAINT PkDepartment_Id PRIMARY KEY (Id),
    CONSTRAINT UnDepartment_DepartmentName UNIQUE (DepartmentName)
);
GO

-- ============================================================
-- 3. Category
-- ============================================================

CREATE TABLE dbo.Category
(
    Id INT IDENTITY(1,1) NOT NULL,
    CategoryName VARCHAR(100) NOT NULL,
    Description VARCHAR(255) NULL,
    IsActive BIT NOT NULL
        CONSTRAINT DfCategory_IsActive DEFAULT 1,
    CreatedDate DATETIME2 NOT NULL
        CONSTRAINT DfCategory_CreatedDate DEFAULT SYSDATETIME(),

    CONSTRAINT PkCategory_Id PRIMARY KEY (Id),
    CONSTRAINT UnCategory_CategoryName UNIQUE (CategoryName)
);
GO

-- ============================================================
-- 4. Priority
-- ============================================================

CREATE TABLE dbo.Priority
(
    Id INT IDENTITY(1,1) NOT NULL,
    PriorityName VARCHAR(50) NOT NULL,
    PriorityLevel INT NOT NULL,
    Description VARCHAR(255) NULL,
    CreatedDate DATETIME2 NOT NULL
        CONSTRAINT DfPriority_CreatedDate DEFAULT SYSDATETIME(),

    CONSTRAINT PkPriority_Id PRIMARY KEY (Id),
    CONSTRAINT UnPriority_PriorityName UNIQUE (PriorityName),
    CONSTRAINT CkPriority_PriorityLevel CHECK (PriorityLevel BETWEEN 1 AND 4)
);
GO

-- ============================================================
-- 5. Status
-- ============================================================

CREATE TABLE dbo.Status
(
    Id INT IDENTITY(1,1) NOT NULL,
    StatusName VARCHAR(50) NOT NULL,
    Description VARCHAR(255) NULL,
    CreatedDate DATETIME2 NOT NULL
        CONSTRAINT DfStatus_CreatedDate DEFAULT SYSDATETIME(),

    CONSTRAINT PkStatus_Id PRIMARY KEY (Id),
    CONSTRAINT UnStatus_StatusName UNIQUE (StatusName)
);
GO

-- ============================================================
-- 6. User
-- Brackets are used because User can conflict with SQL Server terms.
-- ============================================================

CREATE TABLE dbo.[User]
(
    Id INT IDENTITY(1,1) NOT NULL,
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

    CONSTRAINT PkUser_Id PRIMARY KEY (Id),
    CONSTRAINT UnUser_Email UNIQUE (Email),

    CONSTRAINT FkUser_RoleId FOREIGN KEY (RoleId)
        REFERENCES dbo.Role (Id),

    CONSTRAINT FkUser_DepartmentId FOREIGN KEY (DepartmentId)
        REFERENCES dbo.Department (Id)
);
GO

-- ============================================================
-- 7. Ticket
-- ============================================================

CREATE TABLE dbo.Ticket
(
    Id INT IDENTITY(1,1) NOT NULL,
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

    CONSTRAINT PkTicket_Id PRIMARY KEY (Id),
    CONSTRAINT UnTicket_TicketNumber UNIQUE (TicketNumber),

    CONSTRAINT FkTicket_CreatedByUserId FOREIGN KEY (CreatedByUserId)
        REFERENCES dbo.[User] (Id),

    CONSTRAINT FkTicket_CategoryId FOREIGN KEY (CategoryId)
        REFERENCES dbo.Category (Id),

    CONSTRAINT FkTicket_PriorityId FOREIGN KEY (PriorityId)
        REFERENCES dbo.Priority (Id),

    CONSTRAINT FkTicket_StatusId FOREIGN KEY (StatusId)
        REFERENCES dbo.Status (Id)
);
GO

-- ============================================================
-- 8. TicketAssignment
-- ============================================================

CREATE TABLE dbo.TicketAssignment
(
    Id INT IDENTITY(1,1) NOT NULL,
    TicketId INT NOT NULL,
    AssignedToUserId INT NOT NULL,
    AssignedByUserId INT NOT NULL,
    AssignedDate DATETIME2 NOT NULL
        CONSTRAINT DfTicketAssignment_AssignedDate DEFAULT SYSDATETIME(),
    UnassignedDate DATETIME2 NULL,
    AssignmentReason VARCHAR(255) NULL,
    IsCurrent BIT NOT NULL
        CONSTRAINT DfTicketAssignment_IsCurrent DEFAULT 1,

    CONSTRAINT PkTicketAssignment_Id PRIMARY KEY (Id),

    CONSTRAINT FkTicketAssignment_TicketId FOREIGN KEY (TicketId)
        REFERENCES dbo.Ticket (Id),

    CONSTRAINT FkTicketAssignment_AssignedToUserId FOREIGN KEY (AssignedToUserId)
        REFERENCES dbo.[User] (Id),

    CONSTRAINT FkTicketAssignment_AssignedByUserId FOREIGN KEY (AssignedByUserId)
        REFERENCES dbo.[User] (Id)
);
GO

-- ============================================================
-- 9. TicketComment
-- ============================================================

CREATE TABLE dbo.TicketComment
(
    Id INT IDENTITY(1,1) NOT NULL,
    TicketId INT NOT NULL,
    UserId INT NOT NULL,
    CommentText VARCHAR(MAX) NOT NULL,
    IsInternal BIT NOT NULL
        CONSTRAINT DfTicketComment_IsInternal DEFAULT 0,
    CreatedDate DATETIME2 NOT NULL
        CONSTRAINT DfTicketComment_CreatedDate DEFAULT SYSDATETIME(),
    UpdatedDate DATETIME2 NULL,

    CONSTRAINT PkTicketComment_Id PRIMARY KEY (Id),

    CONSTRAINT FkTicketComment_TicketId FOREIGN KEY (TicketId)
        REFERENCES dbo.Ticket (Id),

    CONSTRAINT FkTicketComment_UserId FOREIGN KEY (UserId)
        REFERENCES dbo.[User] (Id)
);
GO

-- ============================================================
-- 10. TicketAttachment
-- ============================================================

CREATE TABLE dbo.TicketAttachment
(
    Id INT IDENTITY(1,1) NOT NULL,
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

    CONSTRAINT PkTicketAttachment_Id PRIMARY KEY (Id),

    CONSTRAINT FkTicketAttachment_TicketId FOREIGN KEY (TicketId)
        REFERENCES dbo.Ticket (Id),

    CONSTRAINT FkTicketAttachment_UploadedByUserId FOREIGN KEY (UploadedByUserId)
        REFERENCES dbo.[User] (Id),

    CONSTRAINT CkTicketAttachment_FileSizeBytes CHECK (FileSizeBytes > 0)
);
GO

-- ============================================================
-- 11. TicketHistory
-- ============================================================

CREATE TABLE dbo.TicketHistory
(
    Id INT IDENTITY(1,1) NOT NULL,
    TicketId INT NOT NULL,
    ChangedByUserId INT NOT NULL,
    FieldName VARCHAR(100) NOT NULL,
    OldValue VARCHAR(500) NULL,
    NewValue VARCHAR(500) NULL,
    ChangeReason VARCHAR(255) NULL,
    CreatedDate DATETIME2 NOT NULL
        CONSTRAINT DfTicketHistory_CreatedDate DEFAULT SYSDATETIME(),

    CONSTRAINT PkTicketHistory_Id PRIMARY KEY (Id),

    CONSTRAINT FkTicketHistory_TicketId FOREIGN KEY (TicketId)
        REFERENCES dbo.Ticket (Id),

    CONSTRAINT FkTicketHistory_ChangedByUserId FOREIGN KEY (ChangedByUserId)
        REFERENCES dbo.[User] (Id)
);
GO

-- ============================================================
-- 12. Notification
-- ============================================================

CREATE TABLE dbo.Notification
(
    Id INT IDENTITY(1,1) NOT NULL,
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

    CONSTRAINT PkNotification_Id PRIMARY KEY (Id),

    CONSTRAINT FkNotification_UserId FOREIGN KEY (UserId)
        REFERENCES dbo.[User] (Id),

    CONSTRAINT FkNotification_TicketId FOREIGN KEY (TicketId)
        REFERENCES dbo.Ticket (Id)
);
GO

-- ============================================================
-- 13. ActivityLog
-- ============================================================

CREATE TABLE dbo.ActivityLog
(
    Id INT IDENTITY(1,1) NOT NULL,
    UserId INT NULL,
    ActionType VARCHAR(100) NOT NULL,
    EntityName VARCHAR(100) NOT NULL,
    EntityId INT NULL,
    Description VARCHAR(500) NULL,
    IpAddress VARCHAR(45) NULL,
    CreatedDate DATETIME2 NOT NULL
        CONSTRAINT DfActivityLog_CreatedDate DEFAULT SYSDATETIME(),

    CONSTRAINT PkActivityLog_Id PRIMARY KEY (Id),

    CONSTRAINT FkActivityLog_UserId FOREIGN KEY (UserId)
        REFERENCES dbo.[User] (Id)
);
GO
