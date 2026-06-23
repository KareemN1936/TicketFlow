import * as signalR from "@microsoft/signalr";
import apiClient from "../api/apiClient";
import type { Notification } from "../types/notification";

export const notificationReceivedEventName = "ticketflow:notification-received";

const apiBaseUrl = String(apiClient.defaults.baseURL || "http://localhost:5215/api");
const backendBaseUrl = apiBaseUrl.replace(/\/api\/?$/i, "");

export function createNotificationConnection(
  onNotification: (notification: Notification) => void,
): signalR.HubConnection {
  const connection = new signalR.HubConnectionBuilder()
    .withUrl(`${backendBaseUrl}/hubs/notifications`, {
      accessTokenFactory: () => localStorage.getItem("token") || "",
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(signalR.LogLevel.Warning)
    .build();

  connection.on("ReceiveNotification", onNotification);
  return connection;
}

