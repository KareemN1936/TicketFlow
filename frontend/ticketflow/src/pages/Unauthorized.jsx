import { Link } from "react-router-dom";
import "../App.css";

function LockIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function Unauthorized() {
  return (
    <main className="unauthorized-page">
      <div className="unauthorized-bg-shape" aria-hidden="true" />
      <section className="card unauthorized-card">
        <span className="unauthorized-code">403</span>
        <div className="unauthorized-icon" aria-hidden="true"><LockIcon /></div>
        <p className="eyebrow">Restricted area</p>
        <h1>Access denied</h1>
        <p>
          Your account does not have permission to view this resource. Return
          to the dashboard to continue working in TicketFlow.
        </p>
        <Link className="btn btn-primary" to="/dashboard">
          Return to dashboard
        </Link>
      </section>
    </main>
  );
}

export default Unauthorized;
