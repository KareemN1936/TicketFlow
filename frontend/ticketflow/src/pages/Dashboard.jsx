import { useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import iconLogo from "../assets/Logo Icon only.png";
import { dashboardDataByRole, quickActionsByRole } from "../data/mockDashboardData";
import "../App.css";

const chartData = [
  { label: "Mon", open: 48, progress: 30, resolved: 21 },
  { label: "Tue", open: 62, progress: 38, resolved: 34 },
  { label: "Wed", open: 55, progress: 34, resolved: 42 },
  { label: "Thu", open: 71, progress: 46, resolved: 37 },
  { label: "Fri", open: 68, progress: 42, resolved: 51 },
  { label: "Sat", open: 37, progress: 24, resolved: 30 },
  { label: "Sun", open: 42, progress: 27, resolved: 35 },
];

const navItemsByRole = {
  Employee: [["dashboard", "Dashboard", "grid"], ["tickets", "My Tickets", "ticket"], ["create", "Create Ticket", "plus"], ["knowledge", "Knowledge Base", "book"], ["notifications", "Notifications", "bell", 3]],
  ITSupportAgent: [["dashboard", "Dashboard", "grid"], ["assigned", "Assigned Tickets", "ticket"], ["tickets", "Tickets", "ticket"], ["knowledge", "Knowledge Base", "book"], ["notifications", "Notifications", "bell", 3]],
  Manager: [["dashboard", "Dashboard", "grid"], ["tickets", "Tickets", "ticket"], ["reports", "Reports", "chart"], ["employees", "Employees / Team", "briefcase"], ["notifications", "Notifications", "bell", 3]],
  Admin: [["dashboard", "Dashboard", "grid"], ["tickets", "Tickets", "ticket", 6], ["create", "Create Ticket", "plus"], ["knowledge", "Knowledge Base", "book"], ["reports", "Reports", "chart"], ["employees", "Employees / Users", "briefcase"], ["notifications", "Notifications", "bell", 3]],
};

const roleAliases = {
  admin: "Admin",
  manager: "Manager",
  employee: "Employee",
  agent: "ITSupportAgent",
  "it support agent": "ITSupportAgent",
  itsupportagent: "ITSupportAgent",
};

function normalizeRole(roles = []) {
  const role = roles.find((item) => roleAliases[String(item).toLowerCase()]);
  return roleAliases[String(role || "Employee").toLowerCase()] || "Employee";
}

function Icon({ name, size = 18 }) {
  const icons = {
    grid: <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></>,
    ticket: <><path d="M4 5h16v5a2 2 0 0 0 0 4v5H4v-5a2 2 0 0 0 0-4V5Z" /><path d="M13 8h-2m2 4h-2m2 4h-2" /></>,
    book: <><path d="M5 4h14v16H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" /><path d="M8 8h7m-7 4h7m-7 4h4" /></>,
    chart: <><path d="M4 20V10m6 10V4m6 16v-7m4 7H2" /></>,
    briefcase: <><rect x="3" y="6" width="18" height="14" rx="2" /><path d="M8 6V4h8v2m-13 6h18m-10 0v2h2v-2" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 13h4" /></>,
    gear: <><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1A7 7 0 0 0 14.8 6L14.5 3h-5L9.2 6a7 7 0 0 0-1.7 1L5.1 6.1l-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .3 0 .7.1 1l-2 1.5 2 3.4 2.4-1a7 7 0 0 0 1.7 1l.3 3h5l.3-3a7 7 0 0 0 1.7-1l2.4 1 2-3.4-2-1.5c.1-.3.1-.7.1-1Z" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    search: <><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></>,
    help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 4.8 1c-.7.9-2.3 1.2-2.3 3m0 3h.01" /></>,
    apps: <><circle cx="5" cy="5" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="19" cy="5" r="1" /><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="19" r="1" /><circle cx="12" cy="19" r="1" /><circle cx="19" cy="19" r="1" /></>,
    calendar: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M8 2v4m8-4v4M3 10h18" /></>,
    download: <><path d="M12 3v12m-4-4 4 4 4-4M5 19h14" /></>,
    alarm: <><circle cx="12" cy="13" r="7" /><path d="M12 9v4l3 2M5 4 2 7m17-3 3 3" /></>,
    userOff: <><path d="m3 3 18 18M10 6a4 4 0 0 1 6 3m-2 5a7 7 0 0 1 6 7M4 21a8 8 0 0 1 9-7" /></>,
    speed: <><path d="M5 19a9 9 0 1 1 14 0M12 13l4-4" /><circle cx="12" cy="13" r="1" /></>,
    filter: <><path d="M4 6h16M7 12h10m-7 6h4" /></>,
    logout: <><path d="M10 17l5-5-5-5m5 5H3m12-9h5v18h-5" /></>,
    plus: <><path d="M12 5v14m-7-7h14" /></>,
    close: <><path d="M18 6 6 18M6 6l12 12" /></>,
    arrowUp: <><path d="M12 5v14M5 12l7-7 7 7" /></>,
    arrowDown: <><path d="M12 19V5M5 12l7 7 7-7" /></>,
    refresh: <><path d="M20 11a8 8 0 0 0-15-3m-1-4v4h4m-4 5a8 8 0 0 0 15 3m1 4v-4h-4" /></>,
    comment: <><path d="M20 15a3 3 0 0 1-3 3H8l-4 3v-3a3 3 0 0 1-1-2V7a3 3 0 0 1 3-3h11a3 3 0 0 1 3 3Z" /></>,
    check: <><path d="m5 12 4 4L19 6" /></>,
    users: <><path d="M16 21a6 6 0 0 0-12 0m6-9a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7-1a3 3 0 0 0 0-6m4 16a5 5 0 0 0-4-5" /></>,
    shield: <><path d="M12 22s8-3 8-10V5l-8-3-8 3v7c0 7 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></>,
    tag: <><path d="m20 13-7 7-9-9V4h7l9 9Z" /><circle cx="8" cy="8" r="1" /></>,
    chevronRight: <><path d="m9 18 6-6-6-6" /></>,
  };

  return <svg className="ui-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icons[name]}</svg>;
}

function KpiGrid({ metrics }) {
  return <section className="stats-grid" aria-label="Ticket overview">{metrics.map(([label, value, icon, iconTone, change, changeTone]) => (
    <article className="card stat-card" key={label}>
      <div className="stat-card-top"><span className={`stat-icon stat-icon-${iconTone}`}><Icon name={icon} size={18} /></span><span className={`stat-badge stat-badge-${changeTone}`}><Icon name={changeTone === "green" ? "arrowDown" : "arrowUp"} size={10} />{change}</span></div>
      <div className="stat-card-body"><p>{label}</p><strong>{value}</strong></div>
      <div className={`stat-card-footer stat-footer-${iconTone}`} />
    </article>
  ))}</section>;
}

function QuickActions({ activeRole, onCreateTicket }) {
  return <section className="card dashboard-panel quick-actions-panel">
    <div className="panel-header"><div><h2>Quick Actions</h2><span className="panel-subtitle">{activeRole} workspace</span></div></div>
    <div className="quick-actions-grid">{quickActionsByRole[activeRole].map(([label, icon]) => (
      <button className="quick-action" type="button" key={label} onClick={label === "Create Ticket" ? onCreateTicket : undefined}><span><Icon name={icon} size={16} /></span>{label}</button>
    ))}</div>
  </section>;
}

function DistributionPanel({ title, subtitle, items }) {
  return <section className="card dashboard-panel distribution-panel">
    <div className="panel-header"><div><h2>{title}</h2><span className="panel-subtitle">{subtitle}</span></div></div>
    <div className="distribution-list">{items.map((item) => <div className="distribution-item" key={item.label}>
      <div className="distribution-label"><span><i className={`dot ${item.tone}`} />{item.label}</span><strong>{item.count}</strong></div>
      <div className="distribution-track"><span className={`distribution-fill ${item.tone}`} style={{ width: `${item.percentage}%` }} /></div><small>{item.percentage}%</small>
    </div>)}</div>
  </section>;
}

function ActivityPanel({ activities, title = "Recent Activity" }) {
  return <section className="card dashboard-panel activity-panel">
    <div className="panel-header"><h2>{title}</h2><span className="panel-badge">{activities.length} new</span></div>
    <div className="activity-list">{activities.length ? activities.map((activity, index) => <article className={`activity-item ${index === 0 ? "latest" : ""}`} key={activity.id}>
      <div className="activity-dot-line"><i className={`dot ${activity.tone}`} />{index < activities.length - 1 && <span className="activity-line" />}</div>
      <div className="activity-content"><p>{activity.title}</p><span className="activity-meta"><span className="activity-time">{activity.meta}</span><span className="activity-author">{activity.author}</span></span></div>
    </article>) : <p className="dashboard-empty-copy">No activity matches your search.</p>}</div>
    <button className="text-button" type="button">View Notification Center <Icon name="chevronRight" size={12} /></button>
  </section>;
}

function TrendChart() {
  return <section className="card dashboard-panel analytics-panel">
    <div className="panel-header"><div><h2>Resolution Trend</h2><span className="panel-subtitle">Weekly ticket volume and resolution progress</span></div><div className="chart-legend"><span><i className="dot blue" />Open</span><span><i className="dot orange" />In Progress</span><span><i className="dot slate" />Resolved</span></div></div>
    <div className="chart-container"><div className="chart-grid">{[0, 25, 50, 75, 100].map((value) => <div key={value} className="chart-gridline" style={{ bottom: `${value}%` }}><span className="chart-gridlabel">{value}</span></div>)}</div>
      <div className="chart-bars-group">{chartData.map((day) => <div className="chart-column" key={day.label}><div className="chart-bar-group"><span className="chart-bar chart-bar-open" style={{ height: `${day.open}%` }} /><span className="chart-bar chart-bar-progress" style={{ height: `${day.progress}%` }} /><span className="chart-bar chart-bar-resolved" style={{ height: `${day.resolved}%` }} /></div><span className="chart-label">{day.label}</span></div>)}</div>
    </div>
  </section>;
}

function SlaPanel({ items }) {
  return <section className="card dashboard-panel urgency-panel">
    <div className="panel-header"><div><h2>SLA &amp; Urgency</h2><span className="panel-subtitle">Tickets that need immediate attention</span></div></div>
    <div className="urgency-grid">{items.map((risk) => <article className={`urgency-item urgency-${risk.tone}`} key={risk.label}><span>{risk.label}</span><strong>{risk.value}</strong><small>{risk.note}</small></article>)}</div>
  </section>;
}

function RecentTicketsTable({ activeRole, tickets }) {
  const isEmployee = activeRole === "Employee";
  const isAgent = activeRole === "ITSupportAgent";
  return <section className="card workload-panel recent-tickets-panel">
    <div className="workload-header"><div><h2>{isEmployee ? "My Recent Tickets" : isAgent ? "My Assigned Tickets" : "Recent Tickets"}</h2><span className="panel-subtitle">{isEmployee ? "Your latest support requests" : isAgent ? "Tickets currently assigned to you" : "Latest incoming and updated service requests"}</span></div><button className="workload-sort" type="button">View All Tickets <Icon name="chevronRight" size={14} /></button></div>
    <div className="table-scroll"><table className="workload-table recent-tickets-table"><thead><tr><th>Reference</th><th>Ticket</th>{!isEmployee && <th>Requester</th>}<th>Category</th><th>Priority</th><th>Status</th>{isAgent && <th>SLA Remaining</th>}{!isEmployee && !isAgent && <th>Assigned Agent</th>}<th>{isEmployee ? "Created Date" : "Created"}</th><th>Last Updated</th></tr></thead>
      <tbody>{tickets.length ? tickets.map((ticket) => <tr key={ticket.reference}><td><strong className="ticket-reference">{ticket.reference}</strong></td><td><strong>{ticket.title}</strong></td>{!isEmployee && <td>{ticket.requester}</td>}<td>{ticket.category}</td><td><span className={`ticket-badge priority-${ticket.priority.toLowerCase()}`}>{ticket.priority}</span></td><td><span className={`ticket-badge ticket-status-${ticket.status.toLowerCase().replace(" ", "-")}`}>{ticket.status}</span></td>{isAgent && <td className={ticket.slaRemaining?.includes("m") ? "ticket-unassigned" : ""}>{ticket.slaRemaining}</td>}{!isEmployee && !isAgent && <td className={ticket.agent === "Unassigned" ? "ticket-unassigned" : ""}>{ticket.agent}</td>}<td>{ticket.createdAt}</td><td>{ticket.updatedAt}</td></tr>) : <tr><td colSpan="9" className="dashboard-empty-copy">No tickets match your search.</td></tr>}</tbody>
    </table></div>
  </section>;
}

function TechnicianWorkload({ technicians, title = "Technician Workload" }) {
  return <section className="card workload-panel">
    <div className="workload-header"><div><h2>{title}</h2><span className="panel-subtitle">Current capacity and ticket resolution performance</span></div><button className="workload-sort" type="button"><Icon name="filter" size={14} />Sort by Capacity</button></div>
    <div className="table-scroll"><table className="workload-table"><thead><tr><th>Agent</th><th className="col-status">Status</th><th className="col-num">Active Tickets</th><th className="col-num">Resolved Today</th><th className="col-num">Avg. Time</th><th className="col-num">Capacity</th></tr></thead>
      <tbody>{technicians.map((technician, index) => <tr key={technician.name} className={index % 2 === 0 ? "even" : "odd"}><td><div className="technician"><span className={`technician-avatar ${technician.tone}`}>{technician.initials}</span><div><strong>{technician.name}</strong><span>{technician.role}</span></div></div></td><td className="col-status"><span className={`status-badge ${technician.status.toLowerCase()}`}><span className="status-dot-indicator" />{technician.status}</span></td><td className="col-num">{String(technician.activeTickets).padStart(2, "0")}</td><td className="col-num">{String(technician.resolvedToday).padStart(2, "0")}</td><td className="col-num">{technician.avgTime}</td><td className="col-num"><div className="capacity-info"><div className={`capacity-track${technician.capacity > 85 ? " danger" : ""}`}><span style={{ width: `${technician.capacity}%` }} /></div><span className="capacity-value">{technician.capacity}%</span></div></td></tr>)}</tbody>
    </table></div>
  </section>;
}

function KnowledgeSuggestions({ articles }) {
  return <section className="card dashboard-panel knowledge-panel"><div className="panel-header"><div><h2>Knowledge Base Suggestions</h2><span className="panel-subtitle">Before creating a ticket, check these articles</span></div></div><div className="knowledge-list">{articles.map(([title, meta]) => <button type="button" className="knowledge-item" key={title}><span><Icon name="book" size={15} /></span><strong>{title}</strong><small>{meta}</small><Icon name="chevronRight" size={14} /></button>)}</div></section>;
}

function AdminStats({ stats }) {
  return <section className="card dashboard-panel admin-stats-panel"><div className="panel-header"><div><h2>User &amp; Assignment Overview</h2><span className="panel-subtitle">Current help desk coverage</span></div></div><div className="admin-stats-grid">{stats.map(([label, value]) => <article key={label}><strong>{value}</strong><span>{label}</span></article>)}</div></section>;
}

function Dashboard() {
  const { user, logout } = useAuth();
  const [query, setQuery] = useState("");
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [newTicketTitle, setNewTicketTitle] = useState("");
  const activeRole = normalizeRole(user?.roles);
  const dashboardData = dashboardDataByRole[activeRole];
  const [activities, setActivities] = useState(dashboardData.activities);
  const normalizedQuery = query.trim().toLowerCase();
  const isEmployee = activeRole === "Employee";
  const isAgent = activeRole === "ITSupportAgent";
  const isManager = activeRole === "Manager";
  const isAdmin = activeRole === "Admin";
  const canExportReport = isManager || isAdmin;
  const canViewSystemAnalytics = isManager || isAdmin;
  const canViewTechnicianWorkload = isManager || isAdmin;
  const canManageUsers = isAdmin;
  const initials = user?.fullName?.split(" ").map((name) => name[0]).join("").slice(0, 2).toUpperCase() || "IT";

  const visibleTickets = useMemo(() => dashboardData.tickets.filter((ticket) => Object.values(ticket).join(" ").toLowerCase().includes(normalizedQuery)), [dashboardData.tickets, normalizedQuery]);
  const visibleActivities = useMemo(() => activities.filter((activity) => activity.title.toLowerCase().includes(normalizedQuery)), [activities, normalizedQuery]);

  function exportReport() {
    const rows = [["Reference", "Title", "Category", "Priority", "Status", "Created"], ...dashboardData.tickets.map((ticket) => [ticket.reference, ticket.title, ticket.category, ticket.priority, ticket.status, ticket.createdAt])];
    const csv = rows.map((row) => row.map((cell) => `"${cell ?? ""}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeRole.toLowerCase()}-ticketflow-report.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function createTicket(event) {
    event.preventDefault();
    const title = newTicketTitle.trim();
    if (!title) return;
    setActivities((current) => [{ id: Date.now(), tone: "blue", title: `New ticket created: ${title}`, meta: "Just now", author: user?.fullName || "TicketFlow User" }, ...current]);
    setNewTicketTitle("");
    setIsTicketModalOpen(false);
  }

  return <div className="dashboard-shell">
    <aside className="sidebar">
      <div className="sidebar-brand"><span className="sidebar-logo"><img src={iconLogo} alt="" /></span><div><h2>TicketFl<span className="sidebar-brand-accent">o</span>w</h2><p>IT Service Management</p></div></div>
      <nav className="sidebar-nav" aria-label="Primary navigation"><div className="sidebar-nav-primary">{navItemsByRole[activeRole].map(([id, label, icon, badge]) => <button className={`sidebar-link${id === "dashboard" ? " active" : ""}`} type="button" key={id} aria-current={id === "dashboard" ? "page" : undefined} onClick={id === "create" ? () => setIsTicketModalOpen(true) : undefined}><span className={`sidebar-link-icon${id === "dashboard" ? " active" : ""}`}><Icon name={icon} size={18} /></span><span className="sidebar-link-label">{label}</span>{badge > 0 && <span className="sidebar-link-badge">{badge}</span>}</button>)}</div>
        <div className="sidebar-nav-secondary">{canManageUsers && <button className="sidebar-link" type="button"><span className="sidebar-link-icon"><Icon name="gear" size={18} /></span><span className="sidebar-link-label">Settings</span></button>}<button className="sidebar-link" type="button"><span className="sidebar-link-icon"><Icon name="user" size={18} /></span><span className="sidebar-link-label">Profile</span></button><div className="sidebar-divider" /><button className="sidebar-link sidebar-logout" type="button" onClick={logout}><span className="sidebar-link-icon"><Icon name="logout" size={18} /></span><span className="sidebar-link-label">Log out</span></button></div>
      </nav>{(isEmployee || isAdmin) && <button className="sidebar-create-ticket" type="button" onClick={() => setIsTicketModalOpen(true)}><Icon name="plus" size={18} />Create Ticket</button>}
    </aside>

    <div className="dashboard-main"><header className="topbar"><label className="dashboard-search"><Icon name="search" size={16} /><span className="sr-only">Search dashboard</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={dashboardData.searchPlaceholder} />{query && <button className="search-clear" type="button" onClick={() => setQuery("")} aria-label="Clear search"><Icon name="close" size={14} /></button>}</label><div className="topbar-actions"><button className="icon-button" type="button" aria-label="Help"><Icon name="help" size={18} /></button><button className="icon-button" type="button" aria-label="Applications"><Icon name="apps" size={18} /></button><button className="icon-button icon-button-notify" type="button" aria-label="Notifications"><Icon name="bell" size={18} /><span className="notify-badge">3</span></button><span className="topbar-divider" /><div className="user-pill"><div><strong>{user?.fullName || "IT User"}</strong><span>{activeRole}</span></div><span className="avatar" aria-hidden="true">{initials}</span></div></div></header>

      <main className="dashboard-content"><section className="dashboard-heading"><div><p className="dashboard-welcome">Welcome back, {user?.fullName || "TicketFlow User"} <span>{activeRole}</span></p><h1>{dashboardData.title}</h1><p>{dashboardData.subtitle}</p></div><div className="heading-actions"><button className="dashboard-button dashboard-button-secondary" type="button"><Icon name="calendar" size={16} />Last 24 Hours</button>{canExportReport && <button className="dashboard-button dashboard-button-primary" type="button" onClick={exportReport}><Icon name="download" size={16} />Export Report</button>}</div></section>
        <KpiGrid metrics={dashboardData.metrics} />

        {isEmployee && <><div className="dashboard-grid dashboard-grid-balanced"><QuickActions activeRole={activeRole} onCreateTicket={() => setIsTicketModalOpen(true)} /><ActivityPanel activities={visibleActivities} title="My Notifications & Updates" /></div><RecentTicketsTable activeRole={activeRole} tickets={visibleTickets} /><KnowledgeSuggestions articles={dashboardData.knowledgeArticles} /></>}

        {isAgent && <><div className="dashboard-grid dashboard-grid-balanced"><SlaPanel items={dashboardData.slaRisks} /><QuickActions activeRole={activeRole} /></div><RecentTicketsTable activeRole={activeRole} tickets={visibleTickets} /><div className="dashboard-grid dashboard-grid-balanced"><ActivityPanel activities={visibleActivities} title="Assigned Ticket Activity" /><TechnicianWorkload technicians={[dashboardData.workload]} title="My Workload & Capacity" /></div></>}

        {canViewSystemAnalytics && <><div className="dashboard-grid dashboard-grid-balanced">{isAdmin ? <SlaPanel items={dashboardData.slaRisks} /> : <TrendChart />}<QuickActions activeRole={activeRole} /></div><div className="distribution-grid"><DistributionPanel title="Tickets by Status" subtitle="Current queue distribution" items={dashboardData.statusDistribution} /><DistributionPanel title="Tickets by Category" subtitle="Requests grouped by service area" items={dashboardData.categories} /><DistributionPanel title="Tickets by Priority" subtitle="Priority mix across open tickets" items={dashboardData.priorities} /></div>{isAdmin && <div className="dashboard-grid"><TrendChart /><AdminStats stats={dashboardData.userStats} /></div>}{isManager && <ActivityPanel activities={visibleActivities} title="Recent Team Activity" />}<RecentTicketsTable activeRole={activeRole} tickets={visibleTickets} />{canViewTechnicianWorkload && <TechnicianWorkload technicians={dashboardData.technicians} title={isManager ? "Agent Performance" : "Technician Workload & Performance"} />}</>}
      </main>
    </div>

    {isTicketModalOpen && <div className="modal-backdrop" role="presentation" onClick={() => setIsTicketModalOpen(false)}><section className="card ticket-modal" role="dialog" aria-modal="true" aria-labelledby="new-ticket-heading" onClick={(event) => event.stopPropagation()}><div className="modal-header"><div><p className="eyebrow">TicketFlow</p><h2 id="new-ticket-heading">Create Ticket</h2></div><button className="icon-button modal-close" type="button" aria-label="Close ticket form" onClick={() => setIsTicketModalOpen(false)}><Icon name="close" size={20} /></button></div><form onSubmit={createTicket}><label className="modal-field"><span>Issue summary</span><input value={newTicketTitle} onChange={(event) => setNewTicketTitle(event.target.value)} placeholder="Describe the support request..." autoFocus required /></label><div className="modal-actions"><button className="dashboard-button dashboard-button-secondary" type="button" onClick={() => setIsTicketModalOpen(false)}>Cancel</button><button className="dashboard-button dashboard-button-primary" type="submit">Create Ticket</button></div></form></section></div>}
  </div>;
}

export default Dashboard;
