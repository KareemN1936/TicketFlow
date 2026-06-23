import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useNotifications } from "../notifications/useNotifications";
import TicketIcon from "./TicketIcon";

const roleAliases = {
  admin: "Admin",
  manager: "Manager",
  employee: "Employee",
  agent: "IT Support Agent",
  itsupportagent: "IT Support Agent",
};

function Topbar() {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const role = roleAliases[String(user?.roles?.[0] || "Employee").toLowerCase()] || user?.roles?.[0] || "Employee";
  const initials = user?.fullName
    ?.split(" ")
    .map((name) => name[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "IT";

  return (
    <header className="topbar ticket-topbar">
      <div>
        <p className="topbar-eyebrow">Support workspace</p>
        <strong className="ticket-topbar-title">Ticket Management</strong>
      </div>
      <div className="topbar-actions">
        <button className="icon-button" type="button" aria-label="Help">
          <TicketIcon name="help" />
        </button>
        <Link className="icon-button icon-button-notify" to="/notifications" aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ""}`}>
          <TicketIcon name="bell" />
          {unreadCount > 0 && <span className="notify-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>}
        </Link>
        <span className="topbar-divider" />
        <div className="user-pill">
          <div>
            <strong>{user?.fullName || "IT User"}</strong>
            <span>{role}</span>
          </div>
          <span className="avatar" aria-hidden="true">{initials}</span>
        </div>
      </div>
    </header>
  );
}

export default Topbar;
