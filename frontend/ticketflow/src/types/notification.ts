export interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  ticketId: number | null;
  isRead: boolean;
  createdAt: string;
}

