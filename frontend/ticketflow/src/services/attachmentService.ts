import apiClient from "../api/apiClient";
import type { TicketAttachment } from "../types/attachment";

export async function getTicketAttachments(ticketId: string | number): Promise<TicketAttachment[]> {
  const response = await apiClient.get<TicketAttachment[]>(`/Tickets/${ticketId}/attachments`);
  return response.data;
}

export async function uploadTicketAttachment(
  ticketId: string | number,
  file: File,
): Promise<TicketAttachment> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post<TicketAttachment>(
    `/Tickets/${ticketId}/attachments`,
    formData,
  );

  return response.data;
}

export async function downloadTicketAttachment(
  ticketId: string | number,
  attachmentId: number,
): Promise<Blob> {
  const response = await apiClient.get(
    `/Tickets/${ticketId}/attachments/${attachmentId}/download`,
    { responseType: "blob" },
  );

  return response.data;
}

export async function deleteTicketAttachment(
  ticketId: string | number,
  attachmentId: number,
): Promise<void> {
  await apiClient.delete(`/Tickets/${ticketId}/attachments/${attachmentId}`);
}

