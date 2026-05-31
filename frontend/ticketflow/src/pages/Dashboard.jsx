import { useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import iconLogo from "../assets/Logo Icon only.png";
import "../App.css";

const navItems = [
  ["dashboard", "Dashboard", "grid", 0],
  ["tickets", "Tickets", "ticket", 6],
  ["knowledge", "Knowledge Base", "book", 0],
  ["reports", "Reports", "chart", 0],
  ["employees", "Employees", "briefcase", 0],
  ["notifications", "Notifications", "bell", 3],
];

const secondaryNavItems = [
  ["settings", "Settings", "gear"],
  ["profile", "Profile", "user"],
];

const initialActivities = [
  {
    id: 1,
    tone: "red",
    title: 'Server cluster "US-EAST-01" critical failure',
    meta: "2 minutes ago",
    author: "DevOps Team",
  },
  {
    id: 2,
    tone: "blue",
    title: "Ticket #8492 assigned to Adam Diab",
    meta: "15 minutes ago",
    author: "Automation",
  },
  {
    id: 3,
    tone: "green",
    title: "Resolved: SSL Certificate Expiry Alert",
    meta: "1 hour ago",
    author: "Sarah Jenkins",
  },
  {
    id: 4,
    tone: "slate",
    title: "New employee onboarding (ID: 5521)",
    meta: "3 hours ago",
    author: "HR Portal Sync",
  },
];

const technicians = [
  {
    name: "Adam Diab",
    initials: "AD",
    role: "Senior Engineer",
    status: "Online",
    activeTickets: 12,
    avgTime: "1.8h",
    capacity: 75,
    tone: "blue",
  },
  {
    name: "Jad AlHassan",
    initials: "JA",
    role: "L2 Support",
    status: "Online",
    activeTickets: 8,
    avgTime: "2.4h",
    capacity: 45,
    tone: "green",
  },
  {
    name: "Khayye El Zein",
    initials: "KEZ",
    role: "Hardware Specialist",
    status: "Away",
    activeTickets: 15,
    avgTime: "4.1h",
    capacity: 95,
    tone: "amber",
  },
];

function randomChartData() {
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return labels.map((label) => ({
    label,
    open: Math.floor(Math.random() * 50) + 25,
    progress: Math.floor(Math.random() * 30) + 10,
    resolved: Math.floor(Math.random() * 25) + 5,
  }));
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
  };

  return (
    <svg className="ui-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {icons[name]}
    </svg>
  );
}

function Dashboard() {
  const { user, logout } = useAuth();
  const [query, setQuery] = useState("");
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [newTicketTitle, setNewTicketTitle] = useState("");
  const [activities, setActivities] = useState(initialActivities);
  const [openTickets, setOpenTickets] = useState(142);
  const [chartData] = useState(randomChartData);
  const roles = user?.roles ?? [];
  const initials = user?.fullName
    ?.split(" ")
    .map((name) => name[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "IT";
  const normalizedQuery = query.trim().toLowerCase();

  const visibleActivities = useMemo(
    () => activities.filter((activity) => activity.title.toLowerCase().includes(normalizedQuery)),
    [activities, normalizedQuery],
  );

  const visibleTechnicians = useMemo(
    () => technicians.filter((technician) => `${technician.name} ${technician.role} ${technician.status}`.toLowerCase().includes(normalizedQuery)),
    [normalizedQuery],
  );

  const ticketingSummary = [
    { label: "Open Tickets", value: openTickets, icon: "ticket", iconTone: "blue", change: "+12%", changeTone: "red", trend: "up" },
    { label: "Tickets Near SLA", value: 28, icon: "alarm", iconTone: "orange", change: "Critical", changeTone: "red", trend: "up" },
    { label: "Unassigned Tickets", value: 14, icon: "userOff", iconTone: "slate", change: "-2 from avg", changeTone: "slate", trend: "down" },
    { label: "Avg. Resolution Time", value: "3.5h", icon: "speed", iconTone: "green", change: "-4.2m", changeTone: "green", trend: "down" },
  ];

  function exportReport() {
    const rows = [
      ["Metric", "Value"],
      ["Open Tickets", openTickets],
      ["Tickets Near SLA", 28],
      ["Unassigned Tickets", 14],
      ["Avg. Resolution Time", "3.5h"],
      [],
      ["Technician", "Status", "Active Tickets", "Avg. Time", "Capacity"],
      ...technicians.map((technician) => [
        technician.name,
        technician.status,
        technician.activeTickets,
        technician.avgTime,
        `${technician.capacity}%`,
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${cell ?? ""}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "ticketflow-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function createTicket(event) {
    event.preventDefault();
    const title = newTicketTitle.trim();
    if (!title) return;

    setOpenTickets((count) => count + 1);
    setActivities((current) => [
      { id: Date.now(), tone: "blue", title: `New ticket created: ${title}`, meta: "Just now", author: user?.fullName || "TicketFlow User" },
      ...current,
    ]);
    setNewTicketTitle("");
    setIsTicketModalOpen(false);
  }

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-logo">
            <img src={iconLogo} alt="" />
          </span>
          <div>
            <h2>TicketFlow</h2>
            <p>IT Service Management</p>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Primary navigation">
          <div className="sidebar-nav-primary">
            {navItems.map(([id, label, icon, badge]) => (
              <button className={`sidebar-link${id === "dashboard" ? " active" : ""}`} type="button" key={id} aria-current={id === "dashboard" ? "page" : undefined} title={`${label} section is not connected yet`}>
                <span className={`sidebar-link-icon${id === "dashboard" ? " active" : ""}`}>
                  <Icon name={icon} size={18} />
                </span>
                <span className="sidebar-link-label">{label}</span>
                {badge > 0 && <span className="sidebar-link-badge">{badge}</span>}
              </button>
            ))}
          </div>
          <div className="sidebar-nav-secondary">
            {secondaryNavItems.map(([id, label, icon]) => (
              <button className="sidebar-link" type="button" key={id} title={`${label} section is not connected yet`}>
                <span className="sidebar-link-icon"><Icon name={icon} size={18} /></span>
                <span className="sidebar-link-label">{label}</span>
              </button>
            ))}
            <div className="sidebar-divider" />
            <button className="sidebar-link sidebar-logout" type="button" onClick={logout}>
              <span className="sidebar-link-icon"><Icon name="logout" size={18} /></span>
              <span className="sidebar-link-label">Log out</span>
            </button>
          </div>
        </nav>

        <button className="sidebar-create-ticket" type="button" onClick={() => setIsTicketModalOpen(true)}>
          <Icon name="plus" size={18} />
          Create Ticket
        </button>
      </aside>

      <div className="dashboard-main">
        <header className="topbar">
          <label className="dashboard-search">
            <Icon name="search" size={16} />
            <span className="sr-only">Search dashboard</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search systems, tickets, or users..." />
            {query && <button className="search-clear" type="button" onClick={() => setQuery("")} aria-label="Clear search"><Icon name="close" size={14} /></button>}
          </label>
          <div className="topbar-actions">
            <button className="icon-button" type="button" aria-label="Help"><Icon name="help" size={18} /></button>
            <button className="icon-button" type="button" aria-label="Applications"><Icon name="apps" size={18} /></button>
            <button className="icon-button icon-button-notify" type="button" aria-label="Notifications"><Icon name="bell" size={18} /><span className="notify-badge">3</span></button>
            <span className="topbar-divider" />
            <div className="user-pill">
              <div>
                <strong>{user?.fullName || "IT User"}</strong>
                <span>{roles.join(", ") || "Authorized user"}</span>
              </div>
              <span className="avatar" aria-hidden="true">{initials}</span>
            </div>
          </div>
        </header>

        <main className="dashboard-content">
          <section className="dashboard-heading">
            <div>
              <h1>System Overview</h1>
              <p>Real-time health and ticket distribution status</p>
            </div>
            <div className="heading-actions">
              <button className="dashboard-button dashboard-button-secondary" type="button"><Icon name="calendar" size={16} />Last 24 Hours</button>
              <button className="dashboard-button dashboard-button-primary" type="button" onClick={exportReport}><Icon name="download" size={16} />Export Report</button>
            </div>
          </section>

          <section className="stats-grid" aria-label="Ticket overview">
            {ticketingSummary.map((stat) => (
              <article className="card stat-card" key={stat.label}>
                <div className="stat-card-top">
                  <span className={`stat-icon stat-icon-${stat.iconTone}`}><Icon name={stat.icon} size={18} /></span>
                  <span className={`stat-badge stat-badge-${stat.changeTone}`}>
                    <Icon name={stat.trend === "up" ? "arrowUp" : "arrowDown"} size={10} />
                    {stat.change}
                  </span>
                </div>
                <div className="stat-card-body">
                  <p>{stat.label}</p>
                  <strong>{stat.value}</strong>
                </div>
                <div className={`stat-card-footer stat-footer-${stat.iconTone}`} />
              </article>
            ))}
          </section>

          <div className="dashboard-grid">
            <section className="card dashboard-panel analytics-panel">
              <div className="panel-header">
                <div>
                  <h2>Ticket Volume &amp; Status</h2>
                  <span className="panel-subtitle">Weekly overview by day</span>
                </div>
                <div className="chart-legend">
                  <span><i className="dot blue" />Open</span>
                  <span><i className="dot orange" />In Progress</span>
                  <span><i className="dot slate" />Resolved</span>
                </div>
              </div>
              <div className="chart-container">
                <div className="chart-grid">
                  {[0, 25, 50, 75, 100].map((val) => (
                    <div key={val} className="chart-gridline" style={{ bottom: `${val}%` }}>
                      <span className="chart-gridlabel">{val}</span>
                    </div>
                  ))}
                </div>
                <div className="chart-bars-group">
                  {chartData.map((day) => (
                    <div className="chart-column" key={day.label}>
                      <div className="chart-bar-group">
                        <span className="chart-bar chart-bar-open" style={{ height: `${day.open}%` }} title={`Open: ${day.open}`} />
                        <span className="chart-bar chart-bar-progress" style={{ height: `${day.progress}%` }} title={`In Progress: ${day.progress}`} />
                        <span className="chart-bar chart-bar-resolved" style={{ height: `${day.resolved}%` }} title={`Resolved: ${day.resolved}`} />
                      </div>
                      <span className="chart-label">{day.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="card dashboard-panel activity-panel">
              <div className="panel-header">
                <h2>Recent Activity</h2>
                <span className="panel-badge">{visibleActivities.length} new</span>
              </div>
              <div className="activity-list">
                {visibleActivities.length ? visibleActivities.map((activity, idx) => (
                  <article className={`activity-item ${idx === 0 ? "latest" : ""}`} key={activity.id}>
                    <div className="activity-dot-line">
                      <i className={`dot ${activity.tone}`} />
                      {idx < visibleActivities.length - 1 && <span className="activity-line" />}
                    </div>
                    <div className="activity-content">
                      <p>{activity.title}</p>
                      <span className="activity-meta">
                        <span className="activity-time">{activity.meta}</span>
                        <span className="activity-author">{activity.author}</span>
                      </span>
                    </div>
                  </article>
                )) : <p className="dashboard-empty-copy">No activity matches your search.</p>}
              </div>
              <button className="text-button" type="button">View All Activity <Icon name="arrowUp" size={12} /></button>
            </section>
          </div>

          <section className="card workload-panel">
            <div className="workload-header">
              <div>
                <h2>Technician Workload</h2>
                <span className="panel-subtitle">Current capacity and ticket distribution</span>
              </div>
              <button className="workload-sort" type="button"><Icon name="filter" size={14} />Sort by Capacity</button>
            </div>
            <div className="table-scroll">
              <table className="workload-table">
                <thead>
                  <tr>
                    <th>Technician</th>
                    <th className="col-status">Status</th>
                    <th className="col-num">Active Tickets</th>
                    <th className="col-num">Avg. Time</th>
                    <th className="col-num">Capacity</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTechnicians.length ? visibleTechnicians.map((technician, idx) => (
                    <tr key={technician.name} className={idx % 2 === 0 ? "even" : "odd"}>
                      <td>
                        <div className="technician">
                          <span className={`technician-avatar ${technician.tone}`}>{technician.initials}</span>
                          <div>
                            <strong>{technician.name}</strong>
                            <span>{technician.role}</span>
                          </div>
                        </div>
                      </td>
                      <td className="col-status">
                        <span className={`status-badge ${technician.status.toLowerCase()}`}>
                          <span className="status-dot-indicator" />
                          {technician.status}
                        </span>
                      </td>
                      <td className="col-num">{String(technician.activeTickets).padStart(2, "0")}</td>
                      <td className="col-num">{technician.avgTime}</td>
                      <td className="col-num">
                        <div className="capacity-info">
                          <div className={`capacity-track${technician.capacity > 85 ? " danger" : ""}`}>
                            <span style={{ width: `${technician.capacity}%` }} />
                          </div>
                          <span className="capacity-value">{technician.capacity}%</span>
                        </div>
                      </td>
                    </tr>
                  )) : <tr><td colSpan="5" className="dashboard-empty-copy">No technicians match your search.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>

      {isTicketModalOpen && (
        <div className="modal-backdrop" role="presentation" onClick={() => setIsTicketModalOpen(false)}>
          <section className="card ticket-modal" role="dialog" aria-modal="true" aria-labelledby="new-ticket-heading" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="eyebrow">TicketFlow</p>
                <h2 id="new-ticket-heading">Create Ticket</h2>
              </div>
              <button className="icon-button modal-close" type="button" aria-label="Close ticket form" onClick={() => setIsTicketModalOpen(false)}><Icon name="close" size={20} /></button>
            </div>
            <form onSubmit={createTicket}>
              <label className="modal-field">
                <span>Issue summary</span>
                <input value={newTicketTitle} onChange={(event) => setNewTicketTitle(event.target.value)} placeholder="Describe the support request..." autoFocus required />
              </label>
              <div className="modal-actions">
                <button className="dashboard-button dashboard-button-secondary" type="button" onClick={() => setIsTicketModalOpen(false)}>Cancel</button>
                <button className="dashboard-button dashboard-button-primary" type="submit">Create Ticket</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
