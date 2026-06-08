import apiClient from "../api/apiClient";

export async function getTickets() {
  const response = await apiClient.get("/Tickets");
  return response.data;
}

export async function getTicketById(id) {
  const response = await apiClient.get(`/Tickets/${id}`);
  return response.data;
}

export async function createTicket(data) {
  const response = await apiClient.post("/Tickets", data);
  return response.data;
}

export async function updateTicket(id, data) {
  const response = await apiClient.put(`/Tickets/${id}`, data);
  return response.data;
}

export async function deleteTicket(id) {
  await apiClient.delete(`/Tickets/${id}`);
}

export async function getCategories() {
  const response = await apiClient.get("/Categories");
  return response.data;
}

export async function getPriorities() {
  const response = await apiClient.get("/Priorities");
  return response.data;
}

export async function getTicketStatuses() {
  const response = await apiClient.get("/TicketStatuses");
  return response.data;
}
