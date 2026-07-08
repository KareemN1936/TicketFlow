import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { userHasRole } from "../auth/roles";
import iconLogo from "../assets/Logo Icon Only.png";
import TicketIcon from "./TicketIcon";

function Sidebar({ isOpen = false, onClose, onNavigate }) {
  const { user, logout } = useAuth();
  const isAdmin = userHasRole(user, "Admin");

  function handleLogout() {
    logout();
    onNavigate?.();
  }

  return (
    <aside className={`sidebar${isOpen ? " is-open" : ""}`} aria-label="Primary">
      <div className="sidebar-brand">
        <span className="sidebar-logo"><img src={iconLogo} alt="" /></span>
        <div>
          <h2>TicketFl<span className="sidebar-brand-accent">o</span>w</h2>
          <p>IT Service Management</p>
        </div>
        <button className="sidebar-close" type="button" aria-label="Close navigation menu" onClick={onClose}>x</button>
      </div>

      <nav className="sidebar-nav" aria-label="Primary navigation">
        <div className="sidebar-nav-primary">
          <NavLink className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`} to="/dashboard" onClick={onNavigate}>
            <span className="sidebar-link-icon"><TicketIcon name="grid" /></span>
            <span className="sidebar-link-label">Dashboard</span>
          </NavLink>
          <NavLink className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`} to="/tickets" end onClick={onNavigate}>
            <span className="sidebar-link-icon"><TicketIcon name="ticket" /></span>
            <span className="sidebar-link-label">Tickets</span>
          </NavLink>
          <NavLink className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`} to="/reports" onClick={onNavigate}>
            <span className="sidebar-link-icon"><TicketIcon name="chart" /></span><span className="sidebar-link-label">Reports</span>
          </NavLink>
          <NavLink className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`} to="/tickets/create" onClick={onNavigate}>
            <span className="sidebar-link-icon"><TicketIcon name="plus" /></span>
            <span className="sidebar-link-label">Create Ticket</span>
          </NavLink>
          {isAdmin && <NavLink className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`} to="/admin" onClick={onNavigate}>
            <span className="sidebar-link-icon"><TicketIcon name="user" /></span>
            <span className="sidebar-link-label">User Management</span>
          </NavLink>}
        </div>

        <div className="sidebar-nav-secondary">
          <div className="sidebar-divider" />
          <button className="sidebar-link sidebar-logout" type="button" onClick={handleLogout}>
            <span className="sidebar-link-icon"><TicketIcon name="logout" /></span>
            <span className="sidebar-link-label">Log out</span>
          </button>
        </div>
      </nav>

      <NavLink className="sidebar-create-ticket" to="/tickets/create" onClick={onNavigate}>
        <TicketIcon name="plus" />
        Create Ticket
      </NavLink>
    </aside>
  );
}

export default Sidebar;
