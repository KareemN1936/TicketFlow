export interface DashboardSummary {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  pendingTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  highPriorityTickets: number;
  criticalPriorityTickets: number;
  unassignedTickets: number;
  myAssignedTickets: number;
}

export interface ChartItem {
  name: string;
  count: number;
}

export interface AgentPerformance {
  agentId: string;
  agentName: string;
  assignedTickets: number;
  resolvedTickets: number;
  openTickets: number;
}

export interface RecentActivity {
  id: number;
  action: string;
  ticketId: number | null;
  ticketReferenceNumber: string;
  performedBy: string;
  createdAt: string;
}

