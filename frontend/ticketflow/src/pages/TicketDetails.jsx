import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import TicketIcon from "../components/TicketIcon";
import { useAuth } from "../auth/AuthContext";
import {
  addTicketComment,
  assignTicket,
  deleteTicket,
  getAgents,
  getTicketActivity,
  getTicketById,
  getTicketComments,
  updateTicketStatus,
} from "../services/ticketService";
import { getApiErrorMessage } from "../utils/apiError";
import { formatTicketDate, toBadgeClass } from "../utils/ticketFormatting";

const statuses = [
  { id: 1, name: "Open" },
  { id: 2, name: "In Progress" },
  { id: 3, name: "Pending" },
  { id: 4, name: "Resolved" },
  { id: 5, name: "Closed" },
];

const activityLabels = {
  TicketCreated: "Ticket created",
  TicketAssigned: "Ticket assigned",
  TicketReassigned: "Ticket reassigned",
  StatusChanged: "Status changed",
  CommentAdded: "Public comment added",
  InternalNoteAdded: "Internal note added",
};

function TicketDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const roles = user?.roles || [];
  const canManageWorkflow = roles.some((role) => ["Admin", "ITSupportAgent", "Manager"].includes(role));

  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [activity, setActivity] = useState([]);
  const [agents, setAgents] = useState([]);
  const [assignedToUserId, setAssignedToUserId] = useState("");
  const [ticketStatusId, setTicketStatusId] = useState("");
  const [commentText, setCommentText] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(location.state?.message || "");

  const loadTicketData = useCallback(async () => {
    const [ticketData, commentData, activityData] = await Promise.all([
      getTicketById(id),
      getTicketComments(id),
      getTicketActivity(id),
    ]);

    setTicket(ticketData);
    setComments(commentData);
    setActivity(activityData);
    setAssignedToUserId(ticketData.assignedToUserId || "");
    setTicketStatusId(String(ticketData.ticketStatusId));
  }, [id]);

  useEffect(() => {
    let ignore = false;

    async function loadPage() {
      try {
        const agentsPromise = canManageWorkflow ? getAgents() : Promise.resolve([]);
        const [ticketData, commentData, activityData, agentData] = await Promise.all([
          getTicketById(id),
          getTicketComments(id),
          getTicketActivity(id),
          agentsPromise,
        ]);

        if (!ignore) {
          setTicket(ticketData);
          setComments(commentData);
          setActivity(activityData);
          setAgents(agentData);
          setAssignedToUserId(ticketData.assignedToUserId || "");
          setTicketStatusId(String(ticketData.ticketStatusId));
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

    loadPage();
    return () => {
      ignore = true;
    };
  }, [canManageWorkflow, id]);

  async function runWorkflowAction(action, message) {
    setError("");
    setSuccess("");
    setIsSaving(true);

    try {
      await action();
      await loadTicketData();
      setSuccess(message);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "The ticket could not be updated."));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAssignment(event) {
    event.preventDefault();

    if (!assignedToUserId) {
      setError("Select a support agent first.");
      return;
    }

    await runWorkflowAction(
      () => assignTicket(ticket.id, assignedToUserId),
      "Ticket assignment updated.",
    );
  }

  async function handleStatusUpdate(event) {
    event.preventDefault();
    await runWorkflowAction(
      () => updateTicketStatus(ticket.id, Number(ticketStatusId)),
      "Ticket status updated.",
    );
  }

  async function handleComment(event) {
    event.preventDefault();

    if (!commentText.trim()) {
      setError("Comment cannot be empty.");
      return;
    }

    await runWorkflowAction(
      () => addTicketComment(ticket.id, commentText.trim(), canManageWorkflow && isInternal),
      isInternal ? "Internal note added." : "Comment added.",
    );
    setCommentText("");
    setIsInternal(false);
  }

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
          <p>Manage the request, conversation, and complete activity history.</p>
        </div>
        <Link className="dashboard-button dashboard-button-secondary" to="/tickets">
          <TicketIcon name="arrowLeft" />
          Back to Tickets
        </Link>
      </section>

      {success && <div className="ticket-alert ticket-alert-success" role="status">{success}</div>}
      {error && <div className="ticket-alert ticket-alert-error" role="alert">{error}</div>}

      {isLoading ? (
        <section className="card ticket-state" role="status">
          <span className="ticket-spinner" />
          <strong>Loading ticket details</strong>
        </section>
      ) : ticket ? (
        <div className="ticket-workflow-layout">
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
                <div><dt>Assigned to</dt><dd>{ticket.assignedToUserName || "Unassigned"}</dd></div>
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

          {canManageWorkflow && (
            <section className="card ticket-workflow-card">
              <header><h2>Workflow controls</h2><p>Assign ownership and move the ticket through its lifecycle.</p></header>
              <form className="ticket-workflow-form" onSubmit={handleAssignment}>
                <label>
                  <span>Assigned support agent</span>
                  <select value={assignedToUserId} onChange={(event) => setAssignedToUserId(event.target.value)}>
                    <option value="">Select an agent</option>
                    {agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.userName || agent.email}</option>)}
                  </select>
                </label>
                <button className="dashboard-button dashboard-button-primary" disabled={isSaving} type="submit">Update assignment</button>
              </form>
              <form className="ticket-workflow-form" onSubmit={handleStatusUpdate}>
                <label>
                  <span>Ticket status</span>
                  <select value={ticketStatusId} onChange={(event) => setTicketStatusId(event.target.value)}>
                    {statuses.map((status) => <option key={status.id} value={status.id}>{status.name}</option>)}
                  </select>
                </label>
                <button className="dashboard-button dashboard-button-primary" disabled={isSaving || Number(ticketStatusId) === ticket.ticketStatusId} type="submit">Update status</button>
              </form>
            </section>
          )}

          <section className="card ticket-conversation-card">
            <header><h2>Comments and replies</h2><p>Public updates are visible to the requester. Internal notes stay with the service team.</p></header>
            <div className="ticket-comment-list">
              {comments.length === 0 ? <p className="ticket-empty-copy">No comments yet.</p> : comments.map((comment) => (
                <article className={`ticket-comment${comment.isInternal ? " internal" : ""}`} key={comment.id}>
                  <div><strong>{comment.userName || "TicketFlow user"}</strong><span>{formatTicketDate(comment.createdAt)}</span></div>
                  {comment.isInternal && <small>Internal note</small>}
                  <p>{comment.commentText}</p>
                </article>
              ))}
            </div>
            <form className="ticket-comment-form" onSubmit={handleComment}>
              <label>
                <span>Add a reply</span>
                <textarea rows="4" value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder="Write a clear update..." />
              </label>
              <div>
                {canManageWorkflow && (
                  <label className="ticket-internal-toggle">
                    <input type="checkbox" checked={isInternal} onChange={(event) => setIsInternal(event.target.checked)} />
                    Internal note
                  </label>
                )}
                <button className="dashboard-button dashboard-button-primary" disabled={isSaving} type="submit">
                  {isSaving ? "Saving..." : isInternal ? "Add internal note" : "Add comment"}
                </button>
              </div>
            </form>
          </section>

          <section className="card ticket-activity-card">
            <header><h2>Activity timeline</h2><p>Chronological ticket history and workflow changes.</p></header>
            <div className="ticket-activity-list">
              {activity.length === 0 ? <p className="ticket-empty-copy">No activity recorded yet.</p> : activity.map((item) => (
                <article className={`ticket-activity-item activity-${toBadgeClass(item.action)}`} key={item.id}>
                  <span className="ticket-activity-marker" />
                  <div>
                    <strong>{activityLabels[item.action] || item.action}</strong>
                    <p>{item.oldValue && item.newValue ? `From ${item.oldValue} to ${item.newValue}` : item.newValue || "Ticket updated"}</p>
                    <small>{item.userName || "TicketFlow user"} | {formatTicketDate(item.createdAt)}</small>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
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
