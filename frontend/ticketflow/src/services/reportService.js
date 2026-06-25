import apiClient from "../api/apiClient";

const get = async (path, signal) => (await apiClient.get(`/reports/${path}`, { signal })).data;

export const reportService = {
  getSummary: (signal) => get("summary", signal),
  getByStatus: (signal) => get("tickets-by-status", signal),
  getByPriority: (signal) => get("tickets-by-priority", signal),
  getByCategory: (signal) => get("tickets-by-category", signal),
  getMonthly: (signal) => get("monthly", signal),
  getAgentPerformance: (signal) => get("agent-performance", signal),
  getEmployeeActivity: (signal) => get("employee-activity", signal),
  async download(format) {
    const response = await apiClient.get(`/reports/export/${format}`, { responseType: "blob" });
    const disposition = response.headers["content-disposition"] || "";
    const match = disposition.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i);
    return { blob: response.data, fileName: match ? decodeURIComponent(match[1].replace(/"/g, "")) : `ticketflow-report.${format === "excel" ? "xlsx" : "pdf"}` };
  },
};
