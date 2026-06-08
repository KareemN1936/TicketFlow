import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import TicketIcon from "../components/TicketIcon";
import { deleteTicket, getTicketById } from "../services/ticketService";
import { getApiErrorMessage } from "../utils/apiError";
import { formatTicketDate, toBadgeClass } from "../utils/ticketFormatting";

function TicketDetails() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadTicket() {
      try {
        const data = await getTicketById(id);
        if (!ignore) {
          setTicket(data);
        }
      } catch (requestError) {
        if (!ignore) {
          setError(getApiErrorMessage(requestError, "The ticket could not be loaded."));
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadTicket();
    return () => {
      ignore = true;
    };
  }, [id]);

  async function handleDelete() {
    if (!window.confirm(`Delete ${ticket.referenceNumber}? This action cannot be undone.`)) {
      return;
    }

    setError("");
    setIsDeleting(true);

    try {
      await deleteTicket(ticket.id);
      navigate("/tickets", { replace: true });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "The ticket could not be deleted."));
      setIsDeleting(false);
    }
  }

  return (
    <AppLayout>
      <section className="dashboard-heading ticket-page-heading">
        <div>
          <p className="dashboard-welcome">Ticket details</p>
          <h1>{ticket?.referenceNumber || "Ticket"}</h1>
          <p>View the complete support request and its latest status.</p>
        </div>
        <Link className="dashboard-button dashboard-button-secondary" to="/tickets">
          <TicketIcon name="arrowLeft" />
          Back to Tickets
        </Link>
      </section>

      {location.state?.message && <div className="ticket-alert ticket-alert-success" role="status">{location.state.message}</div>}
      {error && <div className="ticket-alert ticket-alert-error" role="alert">{error}</div>}

      {isLoading ? (
        <section className="card ticket-state" role="status">
          <span className="ticket-spinner" />
          <strong>Loading ticket details</strong>
        </section>
      ) : ticket ? (
        <section className="card ticket-details-card">
          <header className="ticket-details-header">
            <div>
              <span className="ticket-reference">{ticket.referenceNumber}</span>
              <h2>{ticket.title}</h2>
            </div>
            <div className="ticket-details-badges">
              <span className={`ticket-badge priority-${toBadgeClass(ticket.priorityName)}`}>{ticket.priorityName}</span>
              <span className={`ticket-badge ticket-status-${toBadgeClass(ticket.statusName)}`}>{ticket.statusName}</span>
            </div>
          </header>

          <div className="ticket-details-grid">
            <article className="ticket-description-panel">
              <span>Description</span>
              <p>{ticket.description}</p>
            </article>
            <dl className="ticket-metadata">
              <div><dt>Category</dt><dd>{ticket.categoryName}</dd></div>
              <div><dt>Priority</dt><dd>{ticket.priorityName}</dd></div>
              <div><dt>Status</dt><dd>{ticket.statusName}</dd></div>
              <div><dt>Created by</dt><dd>{ticket.createdByUserName || "Unknown user"}</dd></div>
              <div><dt>Created</dt><dd>{formatTicketDate(ticket.createdAt)}</dd></div>
              <div><dt>Last updated</dt><dd>{formatTicketDate(ticket.updatedAt)}</dd></div>
            </dl>
          </div>

          <footer className="ticket-details-actions">
            <Link className="dashboard-button dashboard-button-secondary" to={`/tickets/${ticket.id}/edit`}>
              <TicketIcon name="edit" />
              Edit Ticket
            </Link>
            <button className="dashboard-button ticket-delete-button" type="button" disabled={isDeleting} onClick={handleDelete}>
              <TicketIcon name="trash" />
              {isDeleting ? "Deleting..." : "Delete Ticket"}
            </button>
          </footer>
        </section>
      ) : (
        <section className="card ticket-state">
          <strong>Ticket not found</strong>
          <p>The ticket may have been deleted or the link is invalid.</p>
          <Link className="dashboard-button dashboard-button-primary" to="/tickets">Back to Tickets</Link>
        </section>
      )}
    </AppLayout>
  );
}

export default TicketDetails;
