import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AppLayout from "../components/AppLayout";
import TicketIcon from "../components/TicketIcon";
import { useAuth } from "../auth/AuthContext";
import { getPrimaryRole } from "../auth/roles";
import { dashboardService } from "../services/dashboardService";
import { getApiErrorMessage } from "../utils/apiError";
import "../App.css";

const chartColors = ["#3b82f6", "#6366f1", "#f97316", "#f59e0b", "#10b981", "#ef4444", "#64748b"];

function ChartEmptyState() {
  return <p className="dashboard-empty-copy dashboard-chart-empty">Nothing to chart in this scope.</p>;
}

function KpiGrid({ summary, role }) {
  const totalLabel = role === "Employee" ? "My Total Tickets" : role === "ITSupportAgent" ? "My Assigned Tickets" : "Total Tickets";
  const prefix = role === "Employee" ? "My " : role === "ITSupportAgent" ? "Assigned " : "";
  const metrics = [
    [totalLabel, role === "ITSupportAgent" ? summary.myAssignedTickets : summary.totalTickets, "ticket", "blue"],
    [`${prefix}Open`, summary.openTickets, "alarm", "orange"],
    [`${prefix}In Progress`, summary.inProgressTickets, "refresh", "amber"],
    [`${prefix}Pending`, summary.pendingTickets, "calendar", "slate"],
    [`${prefix}Resolved`, summary.resolvedTickets, "check", "green"],
    [`${prefix}Closed`, summary.closedTickets, "shield", "green"],
    ["High Priority", summary.highPriorityTickets, "arrowUp", "orange"],
    ["Critical Priority", summary.criticalPriorityTickets, "alarm", "red"],
  ];

  if (role === "Admin") metrics.push(["Unassigned", summary.unassignedTickets, "userOff", "slate"]);
  const visibleMetrics = role === "Employee"
    ? metrics.filter(([label, value]) => !label.includes("Priority") || value > 0)
    : metrics;

  return (
    <section className="stats-grid dashboard-kpi-grid" aria-label="Ticket overview">
      {visibleMetrics.map(([label, value, icon, tone]) => (
        <article className="card stat-card" key={label}>
          <div className="stat-card-top">
            <span className={`stat-icon stat-icon-${tone}`}><TicketIcon name={icon} /></span>
          </div>
          <div className="stat-card-body"><p>{label}</p><strong>{value}</strong></div>
          <div className={`stat-card-footer stat-footer-${tone}`} />
        </article>
      ))}
    </section>
  );
}

const quickActions = {
  Admin: [["Manage Users", "/admin", "user"], ["View Tickets", "/tickets", "ticket"], ["Notifications", "/notifications", "bell"]],
  Manager: [["View Tickets", "/tickets", "ticket"], ["Notifications", "/notifications", "bell"]],
  Employee: [["Create Ticket", "/tickets/create", "plus"], ["My Tickets", "/tickets", "ticket"], ["Notifications", "/notifications", "bell"]],
  ITSupportAgent: [["Assigned Tickets", "/tickets", "ticket"], ["Notifications", "/notifications", "bell"]],
};

function QuickActions({ role }) {
  return <section className="card dashboard-quick-actions"><div className="panel-header"><div><h2>Quick Actions</h2><span className="panel-subtitle">Common tasks for your role</span></div></div><div>{quickActions[role].map(([label, path, icon]) => <Link key={path} className="dashboard-button dashboard-button-secondary" to={path}><TicketIcon name={icon} />{label}</Link>)}</div></section>;
}

function ScopeEmptyState({ role }) {
  const content = {
    Admin: ["No tickets have been created yet.", "Ticket analytics will appear after the first support request.", "/tickets", "View Tickets"],
    Manager: ["No ticket activity is available yet.", "Team reporting will appear when tickets are created.", "/tickets", "View Tickets"],
    Employee: ["You have not created any support tickets yet.", "Create a ticket when you need help from the IT team.", "/tickets/create", "Create Ticket"],
    ITSupportAgent: ["No tickets are currently assigned to you.", "Your workload will appear here when a ticket is assigned.", "/tickets", "View Tickets"],
  }[role];
  return <section className="card dashboard-state dashboard-scope-empty"><TicketIcon name="ticket" size={34} /><h2>{content[0]}</h2><p>{content[1]}</p><Link className="dashboard-button dashboard-button-primary" to={content[2]}>{content[3]}</Link></section>;
}

function StandardTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="dashboard-chart-tooltip">
      <strong>{label || payload[0]?.name}</strong>
      {payload.map((item) => <span key={item.dataKey || item.name}>{item.name}: {item.value}</span>)}
    </div>
  );
}

function BarAnalyticsChart({ title, subtitle, data, color = "#3b82f6", horizontal = false }) {
  return (
    <section className="card dashboard-panel analytics-panel dashboard-chart-panel">
      <div className="panel-header"><div><h2>{title}</h2><span className="panel-subtitle">{subtitle}</span></div></div>
      <div className={`recharts-wrap${horizontal ? " recharts-wrap-tall" : ""}`}>
        {!data.length ? <ChartEmptyState /> : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout={horizontal ? "vertical" : "horizontal"} margin={{ top: 10, right: 14, left: horizontal ? 20 : 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              {horizontal ? <><XAxis type="number" allowDecimals={false} /><YAxis dataKey="name" type="category" width={90} /></> : <><XAxis dataKey="name" interval={0} angle={data.length > 5 ? -25 : 0} textAnchor={data.length > 5 ? "end" : "middle"} height={data.length > 5 ? 65 : 35} /><YAxis allowDecimals={false} /></>}
              <Tooltip content={<StandardTooltip />} />
              <Bar dataKey="count" name="Tickets" fill={color} radius={horizontal ? [0, 5, 5, 0] : [5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}

function PriorityChart({ data }) {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <section className="card dashboard-panel analytics-panel dashboard-chart-panel">
      <div className="panel-header"><div><h2>Tickets by Priority</h2><span className="panel-subtitle">Priority mix for tickets in your scope</span></div></div>
      <div className="recharts-wrap">
        {!data.length ? <ChartEmptyState /> : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="count" nameKey="name" cx="50%" cy="45%" innerRadius={52} outerRadius={82} paddingAngle={2}>
                {data.map((item, index) => <Cell key={item.name} fill={chartColors[index % chartColors.length]} />)}
              </Pie>
              <Tooltip content={<StandardTooltip />} />
              <Legend verticalAlign="bottom" />
              <text x="50%" y="43%" textAnchor="middle" className="chart-total-value">{total}</text>
              <text x="50%" y="51%" textAnchor="middle" className="chart-total-label">tickets</text>
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}

function AgentPerformanceChart({ data }) {
  return (
    <section className="card dashboard-panel analytics-panel dashboard-chart-panel dashboard-chart-wide">
      <div className="panel-header"><div><h2>Agent Performance</h2><span className="panel-subtitle">Assigned, open, and resolved ticket workload by agent</span></div></div>
      <div className="recharts-wrap recharts-wrap-tall">
        {!data.length ? <ChartEmptyState /> : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 14, left: 0, bottom: 45 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="agentName" interval={0} angle={-20} textAnchor="end" height={75} />
              <YAxis allowDecimals={false} />
              <Tooltip content={<StandardTooltip />} />
              <Legend />
              <Bar dataKey="assignedTickets" name="Assigned" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="openTickets" name="Open" fill="#f97316" radius={[4, 4, 0, 0]} />
              <Bar dataKey="resolvedTickets" name="Resolved" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}

function formatActivityTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function ActivityPanel({ activities, title = "Recent Activity" }) {
  return (
    <section className="card dashboard-panel activity-panel dashboard-activity-wide">
      <div className="panel-header"><div><h2>{title}</h2><span className="panel-subtitle">Latest changes to tickets in your scope</span></div><span className="panel-badge">{activities.length}</span></div>
      <div className="activity-list">
        {activities.length ? activities.map((activity, index) => (
          <article className={`activity-item${index === 0 ? " latest" : ""}`} key={activity.id}>
            <div className="activity-dot-line"><i className="dot blue" />{index < activities.length - 1 && <span className="activity-line" />}</div>
            <div className="activity-content">
              <p>{activity.action}{activity.ticketReferenceNumber ? ` — ${activity.ticketReferenceNumber}` : ""}</p>
              <span className="activity-meta"><span className="activity-time">{formatActivityTime(activity.createdAt)}</span><span className="activity-author">{activity.performedBy}</span></span>
            </div>
          </article>
        )) : <p className="dashboard-empty-copy">No recent activity is available.</p>}
      </div>
    </section>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const activeRole = getPrimaryRole(user);
  const canViewAgentPerformance = activeRole === "Admin" || activeRole === "Manager";
  const isAgent = activeRole === "ITSupportAgent";
  const isEmployee = activeRole === "Employee";
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const requests = [
      dashboardService.getSummary(controller.signal),
      dashboardService.getTicketsByStatus(controller.signal),
      dashboardService.getTicketsByPriority(controller.signal),
      dashboardService.getTicketsByCategory(controller.signal),
      dashboardService.getRecentActivity(controller.signal),
    ];

    if (canViewAgentPerformance) requests.push(dashboardService.getAgentPerformance(controller.signal));

    Promise.all(requests)
      .then(([summary, status, priority, category, activity, agentPerformance = []]) => {
        const withData = (items) => items.filter((item) => Number(item.count) > 0);
        if (!controller.signal.aborted) setDashboard({ summary, status: withData(status), priority: withData(priority), category: withData(category), activity, agentPerformance });
      })
      .catch((requestError) => {
        if (!controller.signal.aborted) setError(getApiErrorMessage(requestError, "Dashboard analytics could not be loaded. Please try again."));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [canViewAgentPerformance, reloadKey]);

  function reloadDashboard() {
    setLoading(true);
    setError("");
    setReloadKey((value) => value + 1);
  }

  const heading = useMemo(() => {
    if (isEmployee) return ["My Dashboard", "A live overview of your support requests and recent updates."];
    if (isAgent) return ["Agent Dashboard", "Your assigned workload, ticket mix, and recent activity."];
    if (activeRole === "Manager") return ["Team Reports Dashboard", "Monitor service desk activity, workload, and team performance."];
    return ["Service Desk Dashboard", "Live system-wide ticket analytics and service desk performance."];
  }, [activeRole, isAgent, isEmployee]);

  return (
    <AppLayout>
      <section className="dashboard-heading">
        <div><p className="dashboard-welcome">Welcome back, {user?.fullName || "TicketFlow User"} <span>{activeRole}</span></p><h1>{heading[0]}</h1><p>{heading[1]}</p></div>
        {!loading && <button className="dashboard-button dashboard-button-secondary" type="button" onClick={reloadDashboard}><TicketIcon name="refresh" />Refresh</button>}
      </section>

      {loading && <section className="card dashboard-state" role="status"><span className="dashboard-spinner" /><h2>Loading dashboard analytics</h2><p>Fetching the latest ticket data…</p></section>}

      {!loading && error && <section className="card dashboard-state dashboard-error" role="alert"><TicketIcon name="alarm" /><h2>Unable to load dashboard</h2><p>{error}</p><button className="dashboard-button dashboard-button-primary" type="button" onClick={reloadDashboard}>Try Again</button></section>}

      {!loading && !error && dashboard && <>
        {dashboard.summary.totalTickets === 0 ? <ScopeEmptyState role={activeRole} /> : <>
          <KpiGrid summary={dashboard.summary} role={activeRole} />
          <div className="dashboard-analytics-grid">
            {!isEmployee && <BarAnalyticsChart title="Tickets by Status" subtitle="Current status distribution in your scope" data={dashboard.status} />}
            {!isEmployee && <PriorityChart data={dashboard.priority} />}
          </div>
          <div className={`dashboard-bottom-grid${isEmployee ? " dashboard-bottom-grid-single" : ""}`}>
            {!isEmployee && <BarAnalyticsChart title="Tickets by Category" subtitle="Requests grouped by service area" data={dashboard.category} color="#6366f1" horizontal />}
            <ActivityPanel activities={dashboard.activity} title={isEmployee ? "My Recent Ticket Updates" : "Recent Activity"} />
          </div>
          {canViewAgentPerformance && <div className="dashboard-agent-performance-row"><AgentPerformanceChart data={dashboard.agentPerformance} /></div>}
        </>}
        <QuickActions role={activeRole} />
      </>}
    </AppLayout>
  );
}

export default Dashboard;
