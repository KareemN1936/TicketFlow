import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import TicketIcon from "../components/TicketIcon";
import { useAuth } from "../auth/useAuth";
import { getPrimaryRole } from "../auth/roles";
import { deleteTicket, getTickets } from "../services/ticketService";
import { getApiErrorMessage } from "../utils/apiError";
import { formatTicketDate, toBadgeClass } from "../utils/ticketFormatting";

function Tickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const role = getPrimaryRole(user);
  const canManageWorkflow = ["Admin", "ITSupportAgent", "Manager"].includes(role);
  const isEmployee = role === "Employee";
  const isAgent = role === "ITSupportAgent";

  const filterOptions = useMemo(() => {
    const unique = (key) => [...new Set(tickets.map((ticket) => ticket[key]).filter(Boolean))].sort();
    return {
      statuses: unique("statusName"),
      priorities: unique("priorityName"),
      categories: unique("categoryName"),
    };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return tickets.filter((ticket) => {
      const matchesSearch = !query || [
        ticket.referenceNumber,
        ticket.title,
        ticket.categoryName,
        ticket.priorityName,
        ticket.statusName,
        ticket.createdByUserName,
        ticket.assignedToUserName,
      ].some((value) => String(value || "").toLowerCase().includes(query));

      return matchesSearch
        && (!statusFilter || ticket.statusName === statusFilter)
        && (!priorityFilter || ticket.priorityName === priorityFilter)
        && (!categoryFilter || ticket.categoryName === categoryFilter);
    });
  }, [categoryFilter, priorityFilter, searchTerm, statusFilter, tickets]);

  function clearFilters() {
    setSearchTerm("");
    setStatusFilter("");
    setPriorityFilter("");
    setCategoryFilter("");
  }

  useEffect(() => {
    let ignore = false;

    async function loadTickets() {
      try {
        const data = await getTickets();
        if (!ignore) {
          setTickets(data);
        }
      } catch (requestError) {
        if (!ignore) {
          setError(getApiErrorMessage(requestError, "Tickets could not be loaded."));
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadTickets();
    return () => {
      ignore = true;
    };
  }, []);

  async function handleDelete(ticket) {
    const confirmed = window.confirm(
      `Delete ${ticket.referenceNumber}? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setDeletingId(ticket.id);

    try {
      await deleteTicket(ticket.id);
      setTickets((current) => current.filter((item) => item.id !== ticket.id));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "The ticket could not be deleted."));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AppLayout>
      <section className="dashboard-heading ticket-page-heading">
        <div>
          <p className="dashboard-welcome">TicketFlow service desk</p>
          <h1>Tickets</h1>
          <p>Review, update, and manage support requests.</p>
        </div>
        <Link className="dashboard-button dashboard-button-primary" to="/tickets/create">
          <TicketIcon name="plus" />
          Create Ticket
        </Link>
      </section>

      {error && <div className="ticket-alert ticket-alert-error" role="alert">{error}</div>}

      <section className="card workload-panel ticket-list-card">
        <div className="workload-header">
          <div>
            <h2>{isEmployee ? "My Tickets" : isAgent ? "My Assigned Tickets" : "All Tickets"}</h2>
            <span className="panel-subtitle">
              {isLoading ? "Loading ticket queue..." : `${filteredTickets.length} of ${tickets.length} ticket${tickets.length === 1 ? "" : "s"}`}
            </span>
          </div>
        </div>

        {!isLoading && tickets.length > 0 && (
          <div className="list-filter-bar" aria-label="Ticket filters">
            <label className="list-filter-search">
              <span>Search tickets</span>
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Reference, title, user..."
              />
            </label>
            <label>
              <span>Status</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="">All statuses</option>
                {filterOptions.statuses.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </label>
            <label>
              <span>Priority</span>
              <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
                <option value="">All priorities</option>
                {filterOptions.priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
              </select>
            </label>
            <label>
              <span>Category</span>
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                <option value="">All categories</option>
                {filterOptions.categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </label>
            <button className="dashboard-button dashboard-button-secondary list-filter-clear" type="button" onClick={clearFilters}>
              Clear
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="ticket-state" role="status">
            <span className="ticket-spinner" />
            <strong>Loading tickets</strong>
            <p>Connecting to the TicketFlow API.</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="ticket-state">
            <span className="ticket-state-icon"><TicketIcon name="ticket" size={24} /></span>
            <strong>No tickets yet</strong>
            <p>{isAgent ? "No tickets are currently assigned to you." : isEmployee ? "Create your first support request to get started." : "No tickets are available."}</p>
            <Link className="dashboard-button dashboard-button-primary" to="/tickets/create">
              Create Ticket
            </Link>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="ticket-state ticket-state-filtered">
            <span className="ticket-state-icon"><TicketIcon name="ticket" size={24} /></span>
            <strong>No tickets match these filters</strong>
            <p>Try a different search term or broaden the selected filters.</p>
            <button className="dashboard-button dashboard-button-secondary" type="button" onClick={clearFilters}>Clear filters</button>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="workload-table ticket-management-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Created by</th>
                  <th>Assigned agent</th>
                  <th>Created</th>
                  <th className="ticket-actions-heading">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td><strong className="ticket-reference">{ticket.referenceNumber}</strong></td>
                    <td><Link className="ticket-title-link" to={`/tickets/${ticket.id}`}>{ticket.title}</Link></td>
                    <td>{ticket.categoryName}</td>
                    <td>
                      <span className={`ticket-badge priority-${toBadgeClass(ticket.priorityName)}`}>
                        {ticket.priorityName}
                      </span>
                    </td>
                    <td>
                      <span className={`ticket-badge ticket-status-${toBadgeClass(ticket.statusName)}`}>
                        {ticket.statusName}
                      </span>
                    </td>
                    <td>{ticket.createdByUserName || "Unknown"}</td>
                    <td>{ticket.assignedToUserName || "Unassigned"}</td>
                    <td>{formatTicketDate(ticket.createdAt)}</td>
                    <td>
                      <div className="ticket-row-actions">
                        <Link className="ticket-action-button" to={`/tickets/${ticket.id}`} title="View ticket">
                          <TicketIcon name="eye" size={16} /><span>View</span>
                        </Link>
                        {canManageWorkflow && (
                          <Link className="ticket-action-button" to={`/tickets/${ticket.id}/edit`} title="Edit ticket">
                            <TicketIcon name="edit" size={16} /><span>Edit</span>
                          </Link>
                        )}
                        {canManageWorkflow && (
                          <button
                            className="ticket-action-button ticket-action-danger"
                            type="button"
                            disabled={deletingId === ticket.id}
                            onClick={() => handleDelete(ticket)}
                          >
                            <TicketIcon name="trash" size={16} />
                            <span>{deletingId === ticket.id ? "Deleting" : "Delete"}</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AppLayout>
  );
}

export default Tickets;
