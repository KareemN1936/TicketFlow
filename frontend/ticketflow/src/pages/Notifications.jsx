import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import TicketIcon from "../components/TicketIcon";
import { useNotifications } from "../notifications/useNotifications";
import {
  deleteNotification,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../services/notificationService";
import { getApiErrorMessage } from "../utils/apiError";
import { formatTicketDate } from "../utils/ticketFormatting";
import { notificationReceivedEventName } from "../services/notificationSignalRService";
import "../App.css";

function getNotificationErrorMessage(error, fallbackMessage) {
  if (error.response?.status === 401) return "Your session has expired. Please sign in again.";
  if (error.response?.status === 403) return "You do not have permission to manage these notifications.";
  if (error.response?.status === 404) return "The notification could not be found. It may have already been removed.";
  return getApiErrorMessage(error, fallbackMessage);
}

function formatNotificationType(type) {
  return String(type || "Notification")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^Ticket\s*/, "")
    .trim();
}

function Notifications() {
  const navigate = useNavigate();
  const { refreshUnreadCount } = useNotifications();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [workingId, setWorkingId] = useState(null);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;

    getNotifications()
      .then((data) => {
        if (!ignore) setNotifications(data);
      })
      .catch((requestError) => {
        if (!ignore) setError(getNotificationErrorMessage(requestError, "Notifications could not be loaded."));
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    refreshUnreadCount().catch(() => {
      // The notification list request above provides the visible page error.
    });

    return () => {
      ignore = true;
    };
  }, [refreshUnreadCount, reloadKey]);

  useEffect(() => {
    function handleRealTimeNotification(event) {
      const notification = event.detail;
      setNotifications((items) => items.some((item) => item.id === notification.id)
        ? items
        : [notification, ...items]);
    }

    window.addEventListener(notificationReceivedEventName, handleRealTimeNotification);
    return () => window.removeEventListener(notificationReceivedEventName, handleRealTimeNotification);
  }, []);

  function retryLoading() {
    setError("");
    setIsLoading(true);
    setReloadKey((value) => value + 1);
  }

  async function handleMarkAsRead(notification) {
    setError("");
    setSuccess("");
    setWorkingId(notification.id);

    try {
      await markNotificationAsRead(notification.id);
      setNotifications((items) => items.map((item) => item.id === notification.id ? { ...item, isRead: true } : item));
      refreshUnreadCount().catch(() => {});
    } catch (requestError) {
      setError(getNotificationErrorMessage(requestError, "The notification could not be marked as read."));
    } finally {
      setWorkingId(null);
    }
  }

  async function handleMarkAllAsRead() {
    setError("");
    setSuccess("");
    setIsMarkingAll(true);

    try {
      await markAllNotificationsAsRead();
      setNotifications((items) => items.map((item) => ({ ...item, isRead: true })));
      refreshUnreadCount().catch(() => {});
      setSuccess("All notifications marked as read.");
    } catch (requestError) {
      setError(getNotificationErrorMessage(requestError, "Notifications could not be marked as read."));
    } finally {
      setIsMarkingAll(false);
    }
  }

  async function handleDelete(notification) {
    if (!window.confirm(`Delete “${notification.title}”?`)) return;

    setError("");
    setSuccess("");
    setWorkingId(notification.id);

    try {
      await deleteNotification(notification.id);
      setNotifications((items) => items.filter((item) => item.id !== notification.id));
      refreshUnreadCount().catch(() => {});
      setSuccess("Notification deleted.");
    } catch (requestError) {
      setError(getNotificationErrorMessage(requestError, "The notification could not be deleted."));
    } finally {
      setWorkingId(null);
    }
  }

  async function openRelatedTicket(notification) {
    if (!notification.isRead) {
      try {
        await markNotificationAsRead(notification.id);
        await refreshUnreadCount();
      } catch {
        // Navigation remains available even if the read-state update fails.
      }
    }

    navigate(`/tickets/${notification.ticketId}`);
  }

  const hasUnread = notifications.some((notification) => !notification.isRead);

  return (
    <AppLayout>
      <section className="dashboard-heading ticket-page-heading">
        <div><p className="dashboard-welcome">Notification center</p><h1>Notifications</h1><p>Ticket updates and actions relevant to your account.</p></div>
        <button className="dashboard-button dashboard-button-secondary" type="button" disabled={!hasUnread || isMarkingAll} onClick={handleMarkAllAsRead}>
          <TicketIcon name="check" />
          {isMarkingAll ? "Marking all..." : "Mark all as read"}
        </button>
      </section>

      {success && <div className="ticket-alert ticket-alert-success" role="status">{success}</div>}
      {error && <div className="ticket-alert ticket-alert-error" role="alert">{error}</div>}

      <section className="card notifications-card">
        {isLoading ? (
          <div className="ticket-state" role="status"><span className="ticket-spinner" /><strong>Loading notifications</strong></div>
        ) : error && notifications.length === 0 ? (
          <div className="ticket-state"><strong>Unable to load notifications</strong><button className="dashboard-button dashboard-button-primary" type="button" onClick={retryLoading}>Try again</button></div>
        ) : notifications.length === 0 ? (
          <div className="ticket-state"><span className="ticket-state-icon"><TicketIcon name="bell" size={24} /></span><strong>You’re all caught up</strong><p>No notifications are available for your account.</p></div>
        ) : (
          <div className="notifications-list">
            {notifications.map((notification) => (
              <article className={`notification-item${notification.isRead ? " is-read" : " is-unread"}`} key={notification.id}>
                <span className="notification-icon"><TicketIcon name="bell" /></span>
                <div className="notification-content">
                  <div className="notification-title-row"><h2>{notification.title}</h2><span className={`notification-state ${notification.isRead ? "read" : "unread"}`}>{notification.isRead ? "Read" : "Unread"}</span></div>
                  <p>{notification.message}</p>
                  <div className="notification-meta"><span>{formatNotificationType(notification.type)}</span><time dateTime={notification.createdAt}>{formatTicketDate(notification.createdAt)}</time></div>
                </div>
                <div className="notification-actions">
                  {notification.ticketId && <button className="ticket-action-button" type="button" onClick={() => openRelatedTicket(notification)}>View ticket</button>}
                  {!notification.isRead && <button className="ticket-action-button" type="button" disabled={workingId === notification.id} onClick={() => handleMarkAsRead(notification)}>Mark read</button>}
                  <button className="ticket-action-button ticket-action-danger" type="button" disabled={workingId === notification.id} onClick={() => handleDelete(notification)}><TicketIcon name="trash" />Delete</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </AppLayout>
  );
}

export default Notifications;
