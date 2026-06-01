const categories = [
  { label: "Hardware", count: 32, percentage: 23, tone: "blue" },
  { label: "Software", count: 41, percentage: 29, tone: "indigo" },
  { label: "Network", count: 18, percentage: 13, tone: "orange" },
  { label: "Email", count: 25, percentage: 18, tone: "green" },
  { label: "Access Request", count: 16, percentage: 11, tone: "amber" },
  { label: "Other", count: 10, percentage: 7, tone: "slate" },
];

const priorities = [
  { label: "Low", count: 35, percentage: 25, tone: "green" },
  { label: "Medium", count: 52, percentage: 37, tone: "blue" },
  { label: "High", count: 38, percentage: 27, tone: "orange" },
  { label: "Critical", count: 17, percentage: 12, tone: "red" },
];

const statusDistribution = [
  { label: "Open", count: 142, percentage: 37, tone: "blue" },
  { label: "In Progress", count: 64, percentage: 17, tone: "orange" },
  { label: "Pending", count: 31, percentage: 8, tone: "amber" },
  { label: "Resolved", count: 89, percentage: 23, tone: "green" },
  { label: "Closed", count: 58, percentage: 15, tone: "slate" },
];

const teamTechnicians = [
  { name: "Adam Diab", initials: "AD", role: "Senior Engineer", status: "Online", activeTickets: 12, resolvedToday: 9, avgTime: "1.8h", capacity: 75, tone: "blue" },
  { name: "Jad AlHassan", initials: "JA", role: "L2 Support", status: "Online", activeTickets: 8, resolvedToday: 7, avgTime: "2.4h", capacity: 45, tone: "green" },
  { name: "Khayye El Zein", initials: "KE", role: "Hardware Specialist", status: "Busy", activeTickets: 15, resolvedToday: 5, avgTime: "4.1h", capacity: 95, tone: "amber" },
  { name: "Lina Farah", initials: "LF", role: "Service Desk Agent", status: "Offline", activeTickets: 5, resolvedToday: 8, avgTime: "2.1h", capacity: 32, tone: "slate" },
];

const systemTickets = [
  { reference: "HD-1001", title: "Laptop not turning on", requester: "Sarah Jenkins", category: "Hardware", priority: "High", status: "Open", agent: "Unassigned", createdAt: "5 min ago", updatedAt: "5 min ago" },
  { reference: "HD-1002", title: "Outlook email not syncing", requester: "Karim Haddad", category: "Email", priority: "Medium", status: "In Progress", agent: "Adam Diab", createdAt: "18 min ago", updatedAt: "8 min ago", slaRemaining: "3h 12m" },
  { reference: "HD-1003", title: "VPN access request", requester: "Maya Salem", category: "Access Request", priority: "Low", status: "Pending", agent: "Lina Farah", createdAt: "1 hr ago", updatedAt: "22 min ago", slaRemaining: "6h 40m" },
  { reference: "HD-1004", title: "Wi-Fi keeps disconnecting", requester: "Omar Khalil", category: "Network", priority: "High", status: "Open", agent: "Unassigned", createdAt: "2 hrs ago", updatedAt: "42 min ago" },
  { reference: "HD-1005", title: "Software installation request", requester: "Rami Nassar", category: "Software", priority: "Medium", status: "Resolved", agent: "Sarah Jenkins", createdAt: "4 hrs ago", updatedAt: "1 hr ago", slaRemaining: "Met" },
];

const systemActivities = [
  { id: 1, tone: "blue", title: "Ticket HD-1002 assigned to Adam Diab", meta: "15 minutes ago", author: "Automation" },
  { id: 2, tone: "orange", title: "SLA warning: HD-0987 is nearing breach", meta: "28 minutes ago", author: "SLA Monitor" },
  { id: 3, tone: "green", title: "Ticket HD-0995 resolved: SSL certificate renewal", meta: "1 hour ago", author: "Sarah Jenkins" },
  { id: 4, tone: "slate", title: "New internal note added to HD-0991", meta: "3 hours ago", author: "Jad AlHassan" },
];

const employeeTickets = [
  { reference: "HD-1003", title: "VPN access request", category: "Access Request", priority: "Low", status: "Pending", createdAt: "Today, 9:20 AM", updatedAt: "22 min ago" },
  { reference: "HD-0979", title: "Outlook calendar not syncing", category: "Email", priority: "Medium", status: "In Progress", createdAt: "Yesterday", updatedAt: "1 hr ago" },
  { reference: "HD-0961", title: "Password reset for payroll portal", category: "Access Request", priority: "High", status: "Resolved", createdAt: "May 29", updatedAt: "May 30" },
];

const agentTickets = [
  systemTickets[1],
  { reference: "HD-0997", title: "Printer queue unavailable", requester: "Nour Mansour", category: "Hardware", priority: "High", status: "In Progress", agent: "Adam Diab", createdAt: "45 min ago", updatedAt: "12 min ago", slaRemaining: "58m" },
  { reference: "HD-0987", title: "Shared drive access denied", requester: "Tarek Abbas", category: "Access Request", priority: "Critical", status: "Open", agent: "Adam Diab", createdAt: "3 hrs ago", updatedAt: "35 min ago", slaRemaining: "18m" },
  { reference: "HD-0972", title: "New laptop software setup", requester: "Dana Rizk", category: "Software", priority: "Medium", status: "Pending", agent: "Adam Diab", createdAt: "Yesterday", updatedAt: "2 hrs ago", slaRemaining: "5h 10m" },
];

export const quickActionsByRole = {
  Employee: [["Create Ticket", "plus"], ["View My Tickets", "ticket"], ["Track Requests", "search"], ["View Notifications", "bell"]],
  ITSupportAgent: [["View Assigned Tickets", "ticket"], ["Update Ticket Status", "refresh"], ["Add Comment", "comment"], ["Resolve Ticket", "check"]],
  Manager: [["View Team Tickets", "ticket"], ["View Reports", "chart"], ["Monitor SLA", "alarm"], ["Agent Performance", "users"]],
  Admin: [["Manage Users", "users"], ["Manage Roles", "shield"], ["Assign Tickets", "ticket"], ["Manage Categories", "tag"], ["View Reports", "chart"], ["System Settings", "gear"]],
};

export const employeeDashboardData = {
  title: "My Help Desk Dashboard",
  subtitle: "Track your support requests and recent updates.",
  searchPlaceholder: "Search your tickets or knowledge base...",
  metrics: [
    ["My Open Tickets", 3, "ticket", "blue", "1 updated", "slate"],
    ["My In Progress", 2, "refresh", "orange", "Agent assigned", "green"],
    ["My Pending Tickets", 1, "alarm", "amber", "Awaiting reply", "slate"],
    ["My Resolved Tickets", 8, "check", "green", "+2 this month", "green"],
  ],
  tickets: employeeTickets,
  activities: [
    { id: 1, tone: "orange", title: "More information requested for HD-1003", meta: "22 minutes ago", author: "Lina Farah" },
    { id: 2, tone: "blue", title: "Agent replied to HD-0979", meta: "1 hour ago", author: "Adam Diab" },
    { id: 3, tone: "green", title: "Ticket HD-0961 resolved", meta: "3 days ago", author: "Support Team" },
    { id: 4, tone: "slate", title: "Status changed to In Progress for HD-0979", meta: "Yesterday", author: "Automation" },
  ],
  knowledgeArticles: [
    ["Connect to the company VPN", "5 min read"],
    ["Troubleshoot Outlook email sync", "4 min read"],
    ["Reset your password securely", "3 min read"],
  ],
};

export const agentDashboardData = {
  title: "Agent Workspace",
  subtitle: "Manage assigned tickets and resolve support requests.",
  searchPlaceholder: "Search assigned tickets, requesters, or knowledge base...",
  metrics: [
    ["Assigned to Me", 12, "ticket", "blue", "3 new", "red"],
    ["In Progress", 6, "refresh", "orange", "50% queue", "slate"],
    ["Pending Response", 3, "comment", "amber", "Awaiting user", "slate"],
    ["Resolved Today", 9, "check", "green", "+2 vs avg", "green"],
    ["Critical Assigned", 2, "alarm", "red", "Needs triage", "red"],
    ["SLA At Risk", 3, "speed", "orange", "Under 1 hour", "red"],
  ],
  tickets: agentTickets,
  activities: systemActivities.slice(0, 3),
  slaRisks: [
    { label: "SLA At Risk", value: 3, note: "Assigned to you", tone: "orange" },
    { label: "Critical Waiting", value: 2, note: "Start triage now", tone: "red" },
    { label: "Pending Response", value: 3, note: "Customer follow-up", tone: "amber" },
    { label: "Oldest Assigned", value: "1d 2h", note: "HD-0968 - Email", tone: "slate" },
  ],
  workload: teamTechnicians[0],
};

export const managerDashboardData = {
  title: "Team Support Overview",
  subtitle: "Monitor team performance, SLA risk, and ticket trends.",
  searchPlaceholder: "Search team tickets, reports, or employees...",
  metrics: [
    ["Open Team Tickets", 142, "ticket", "blue", "+12%", "red"],
    ["In Progress", 64, "refresh", "orange", "17% total", "slate"],
    ["Pending", 31, "alarm", "amber", "8% total", "slate"],
    ["Resolved This Week", 186, "check", "green", "+14%", "green"],
    ["SLA At Risk", 28, "speed", "orange", "Needs review", "red"],
    ["Avg. Resolution Time", "3.5h", "speed", "green", "-4.2m", "green"],
  ],
  tickets: systemTickets,
  activities: systemActivities,
  categories,
  priorities,
  statusDistribution,
  technicians: teamTechnicians,
};

export const adminDashboardData = {
  title: "System Overview",
  subtitle: "Monitor ticket distribution, users, workload, and support performance.",
  searchPlaceholder: "Search tickets, users, categories, or knowledge base...",
  metrics: [
    ["Open Tickets", 142, "ticket", "blue", "+12%", "red"],
    ["In Progress", 64, "refresh", "orange", "17% total", "slate"],
    ["Pending Tickets", 31, "alarm", "amber", "8% total", "slate"],
    ["Resolved Tickets", 89, "check", "green", "+18 today", "green"],
    ["Closed Tickets", 58, "shield", "slate", "+9 today", "green"],
    ["High / Critical", 55, "alarm", "red", "Needs triage", "red"],
    ["Unassigned Tickets", 14, "userOff", "slate", "-2 from avg", "slate"],
    ["SLA At Risk", 28, "speed", "orange", "Critical", "red"],
    ["Avg. Resolution Time", "3.5h", "speed", "green", "-4.2m", "green"],
  ],
  tickets: systemTickets,
  activities: systemActivities,
  categories,
  priorities,
  statusDistribution,
  technicians: teamTechnicians,
  slaRisks: [
    { label: "Near SLA", value: 28, note: "Need attention soon", tone: "orange" },
    { label: "Breached SLA", value: 6, note: "Escalate immediately", tone: "red" },
    { label: "Critical Waiting", value: 11, note: "High urgency queue", tone: "amber" },
    { label: "Oldest Open Ticket", value: "2d 4h", note: "HD-0976 - Network", tone: "slate" },
  ],
  userStats: [["Employees", 248], ["Support Agents", 18], ["Online Agents", 11], ["Unassigned Queue", 14]],
};

export const dashboardDataByRole = {
  Employee: employeeDashboardData,
  ITSupportAgent: agentDashboardData,
  Manager: managerDashboardData,
  Admin: adminDashboardData,
};
