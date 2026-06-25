import { useCallback, useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import AppLayout from "../components/AppLayout";
import TicketIcon from "../components/TicketIcon";
import { useAuth } from "../auth/AuthContext";
import { getPrimaryRole } from "../auth/roles";
import { reportService } from "../services/reportService";
import { getApiErrorMessage } from "../utils/apiError";

function ReportChart({ title, data, keys = [{ key: "count", label: "Tickets", color: "#3b82f6" }] }) {
  return <section className="card dashboard-panel dashboard-chart-panel report-chart-panel"><div className="panel-header"><h2>{title}</h2></div><div className="recharts-wrap">
    {!data.length ? <p className="dashboard-empty-copy dashboard-chart-empty">No report data available yet.</p> : <ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{ top: 16, right: 24, left: 12, bottom: 18 }}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/><XAxis dataKey={data[0]?.month ? "month" : "name"}/><YAxis allowDecimals={false}/><Tooltip/><Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: 10 }}/>{keys.map(x => <Bar key={x.key} dataKey={x.key} name={x.label} fill={x.color} radius={[4,4,0,0]}/>)}</BarChart></ResponsiveContainer>}
  </div></section>;
}

function Reports() {
  const { user } = useAuth();
  const role = getPrimaryRole(user);
  const canViewPeople = role === "Admin" || role === "Manager";
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState("");

  const load = useCallback(() => {
    const controller = new AbortController();
    const requests = [reportService.getSummary(controller.signal), reportService.getByStatus(controller.signal), reportService.getByPriority(controller.signal), reportService.getByCategory(controller.signal), reportService.getMonthly(controller.signal)];
    if (canViewPeople) requests.push(reportService.getAgentPerformance(controller.signal), reportService.getEmployeeActivity(controller.signal));
    Promise.all(requests).then(([summary, status, priority, category, monthly, agents = [], employees = []]) => setData({ summary, status, priority, category, monthly, agents, employees })).catch(e => { if (!controller.signal.aborted) setError(getApiErrorMessage(e, "Reports could not be loaded.")); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [canViewPeople]);

  useEffect(() => load(), [load]);

  function refresh() { setLoading(true); setError(""); load(); }

  async function exportReport(format) {
    setExporting(format); setError("");
    try { const { blob, fileName } = await reportService.download(format); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = fileName; link.click(); URL.revokeObjectURL(url); }
    catch (e) { setError(getApiErrorMessage(e, `The ${format} report could not be exported.`)); }
    finally { setExporting(""); }
  }

  const metrics = data ? [["Total", data.summary.totalTickets], ["Open", data.summary.openTickets], ["In Progress", data.summary.inProgressTickets], ["Pending", data.summary.pendingTickets], ["Resolved", data.summary.resolvedTickets], ["Closed", data.summary.closedTickets], ["Avg. Resolution", `${data.summary.averageResolutionHours}h`]] : [];
  return <AppLayout><section className="dashboard-heading"><div><p className="dashboard-welcome">Analytics</p><h1>Reports</h1><p>Live ticket data for your permitted scope.</p></div><div className="report-actions"><button className="dashboard-button dashboard-button-secondary" onClick={() => exportReport("pdf")} disabled={!!exporting}>Export PDF</button><button className="dashboard-button dashboard-button-secondary" onClick={() => exportReport("excel")} disabled={!!exporting}>Export Excel</button><button className="dashboard-button dashboard-button-primary" onClick={refresh} disabled={loading}><TicketIcon name="refresh"/>Refresh</button></div></section>
    {error && <div className="ticket-alert ticket-alert-error" role="alert">{error}</div>}
    {loading ? <section className="card dashboard-state"><span className="dashboard-spinner"/><h2>Loading reports</h2></section> : data && <>{data.summary.totalTickets === 0 ? <section className="card dashboard-state"><h2>No report data available yet.</h2></section> : <><section className="stats-grid dashboard-kpi-grid">{metrics.map(([label,value]) => <article className="card stat-card" key={label}><div className="stat-card-body"><p>{label}</p><strong>{value}</strong></div></article>)}</section><div className="dashboard-analytics-grid"><ReportChart title="Tickets by Status" data={data.status}/><ReportChart title="Tickets by Priority" data={data.priority}/><ReportChart title="Tickets by Category" data={data.category}/><ReportChart title="Monthly Ticket Trends" data={data.monthly} keys={[{key:"created",label:"Created",color:"#3b82f6"},{key:"resolved",label:"Resolved",color:"#10b981"}]}/></div>{canViewPeople && <section className="card report-table-card"><h2>Agent Performance</h2>{!data.agents.length ? <p>No agent data available yet.</p> : <div className="report-table-wrap"><table><thead><tr><th>Agent</th><th>Assigned</th><th>Resolved</th><th>Open</th><th>Avg. resolution</th></tr></thead><tbody>{data.agents.map(x => <tr key={x.agentId}><td>{x.agentName}</td><td>{x.assignedTickets}</td><td>{x.resolvedTickets}</td><td>{x.openTickets}</td><td>{x.averageResolutionHours}h</td></tr>)}</tbody></table></div>}</section>}</>}</>}
  </AppLayout>;
}
export default Reports;
