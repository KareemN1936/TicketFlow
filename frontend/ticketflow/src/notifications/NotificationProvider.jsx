import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { getUnreadNotificationCount } from "../services/notificationService";
import {
  createNotificationConnection,
  notificationReceivedEventName,
} from "../services/notificationSignalRService";
import NotificationContext from "./notificationContext";

function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    if (!user) return 0;

    const count = await getUnreadNotificationCount();
    setUnreadCount(count);
    return count;
  }, [user]);

  useEffect(() => {
    if (!user) return undefined;

    let ignore = false;
    getUnreadNotificationCount()
      .then((count) => {
        if (!ignore) setUnreadCount(count);
      })
      .catch(() => {
        // The page-level error state handles API errors when the user opens notifications.
      });

    return () => {
      ignore = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user) return undefined;

    const connection = createNotificationConnection((notification) => {
      if (!notification.isRead) {
        setUnreadCount((count) => count + 1);
      }

      window.dispatchEvent(new CustomEvent(notificationReceivedEventName, { detail: notification }));
    });

    connection.onreconnected(() => {
      refreshUnreadCount().catch(() => {});
    });

    connection.start().catch((connectionError) => {
      console.warn("Real-time notifications are unavailable; using API fallback.", connectionError);
    });

    return () => {
      connection.stop().catch(() => {});
    };
  }, [refreshUnreadCount, user]);

  useEffect(() => {
    if (!user) return undefined;

    const refreshSilently = () => {
      refreshUnreadCount().catch(() => {});
    };
    const intervalId = window.setInterval(refreshSilently, 30000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") refreshSilently();
    };

    window.addEventListener("focus", refreshSilently);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshSilently);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshUnreadCount, user]);

  const value = useMemo(
    () => ({ unreadCount, refreshUnreadCount }),
    [refreshUnreadCount, unreadCount],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export default NotificationProvider;
