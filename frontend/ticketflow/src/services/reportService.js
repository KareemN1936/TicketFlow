import apiClient from "../api/apiClient";

const buildParams = (filters = {}) => {
  const params = {};
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  return params;
};

const get = async (path, signal, filters) => (await apiClient.get(`/reports/${path}`, { signal, params: buildParams(filters) })).data;

export const reportService = {
  getSummary: (signal, filters) => get("summary", signal, filters),
  getByStatus: (signal, filters) => get("tickets-by-status", signal, filters),
  getByPriority: (signal, filters) => get("tickets-by-priority", signal, filters),
  getByCategory: (signal, filters) => get("tickets-by-category", signal, filters),
  getMonthly: (signal, filters) => get("monthly", signal, filters),
  getAgentPerformance: (signal, filters) => get("agent-performance", signal, filters),
  getEmployeeActivity: (signal, filters) => get("employee-activity", signal, filters),
  async download(format, filters) {
    const response = await apiClient.get(`/reports/export/${format}`, { responseType: "blob", params: buildParams(filters) });
    const disposition = response.headers["content-disposition"] || "";
    const match = disposition.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i);
    return { blob: response.data, fileName: match ? decodeURIComponent(match[1].replace(/"/g, "")) : `ticketflow-report.${format === "excel" ? "xlsx" : "pdf"}` };
  },
};
