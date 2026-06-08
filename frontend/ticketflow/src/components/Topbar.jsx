import { useAuth } from "../auth/AuthContext";
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
        <button className="icon-button icon-button-notify" type="button" aria-label="Notifications">
          <TicketIcon name="bell" />
          <span className="notify-badge">3</span>
        </button>
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
