import apiClient from "../api/apiClient";
import type {
  AgentPerformance,
  ChartItem,
  DashboardSummary,
  RecentActivity,
} from "../types/dashboard";

const dashboardPath = "/dashboard";

export const dashboardService = {
  async getSummary(signal?: AbortSignal): Promise<DashboardSummary> {
    const response = await apiClient.get<DashboardSummary>(`${dashboardPath}/summary`, { signal });
    return response.data;
  },

  async getTicketsByStatus(signal?: AbortSignal): Promise<ChartItem[]> {
    const response = await apiClient.get<ChartItem[]>(`${dashboardPath}/tickets-by-status`, { signal });
    return response.data;
  },

  async getTicketsByPriority(signal?: AbortSignal): Promise<ChartItem[]> {
    const response = await apiClient.get<ChartItem[]>(`${dashboardPath}/tickets-by-priority`, { signal });
    return response.data;
  },

  async getTicketsByCategory(signal?: AbortSignal): Promise<ChartItem[]> {
    const response = await apiClient.get<ChartItem[]>(`${dashboardPath}/tickets-by-category`, { signal });
    return response.data;
  },

  async getAgentPerformance(signal?: AbortSignal): Promise<AgentPerformance[]> {
    const response = await apiClient.get<AgentPerformance[]>(`${dashboardPath}/agent-performance`, { signal });
    return response.data;
  },

  async getRecentActivity(signal?: AbortSignal): Promise<RecentActivity[]> {
    const response = await apiClient.get<RecentActivity[]>(`${dashboardPath}/recent-activity`, { signal });
    return response.data;
  },
};
