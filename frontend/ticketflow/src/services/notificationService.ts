import apiClient from "../api/apiClient";
import type { Notification } from "../types/notification";

export async function getNotifications(): Promise<Notification[]> {
  const response = await apiClient.get<Notification[]>("/notifications");
  return response.data;
}

export async function getUnreadNotificationCount(): Promise<number> {
  const response = await apiClient.get<{ unreadCount: number }>("/notifications/unread-count");
  return response.data.unreadCount;
}

export async function markNotificationAsRead(id: number): Promise<void> {
  await apiClient.put(`/notifications/${id}/read`);
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await apiClient.put("/notifications/read-all");
}

export async function deleteNotification(id: number): Promise<void> {
  await apiClient.delete(`/notifications/${id}`);
}

