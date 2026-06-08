import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import iconLogo from "../assets/Logo Icon Only.png";
import TicketIcon from "./TicketIcon";

function Sidebar() {
  const { logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-logo"><img src={iconLogo} alt="" /></span>
        <div>
          <h2>TicketFl<span className="sidebar-brand-accent">o</span>w</h2>
          <p>IT Service Management</p>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Primary navigation">
        <div className="sidebar-nav-primary">
          <NavLink className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`} to="/dashboard">
            <span className="sidebar-link-icon"><TicketIcon name="grid" /></span>
            <span className="sidebar-link-label">Dashboard</span>
          </NavLink>
          <NavLink className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`} to="/tickets" end>
            <span className="sidebar-link-icon"><TicketIcon name="ticket" /></span>
            <span className="sidebar-link-label">Tickets</span>
          </NavLink>
          <NavLink className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`} to="/tickets/create">
            <span className="sidebar-link-icon"><TicketIcon name="plus" /></span>
            <span className="sidebar-link-label">Create Ticket</span>
          </NavLink>
        </div>

        <div className="sidebar-nav-secondary">
          <div className="sidebar-divider" />
          <button className="sidebar-link sidebar-logout" type="button" onClick={logout}>
            <span className="sidebar-link-icon"><TicketIcon name="logout" /></span>
            <span className="sidebar-link-label">Log out</span>
          </button>
        </div>
      </nav>

      <NavLink className="sidebar-create-ticket" to="/tickets/create">
        <TicketIcon name="plus" />
        Create Ticket
      </NavLink>
    </aside>
  );
}

export default Sidebar;
