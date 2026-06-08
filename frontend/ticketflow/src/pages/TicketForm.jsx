import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import TicketIcon from "../components/TicketIcon";
import {
  createTicket,
  getCategories,
  getPriorities,
  getTicketById,
  getTicketStatuses,
  updateTicket,
} from "../services/ticketService";
import { getApiErrorMessage } from "../utils/apiError";

const initialForm = {
  title: "",
  description: "",
  categoryId: "",
  priorityId: "",
  ticketStatusId: "",
};

function TicketForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const [formData, setFormData] = useState(initialForm);
  const [categories, setCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    let ignore = false;

    async function loadForm() {
      try {
        const requests = [getCategories(), getPriorities()];
        if (isEditing) {
          requests.push(getTicketStatuses(), getTicketById(id));
        }

        const [categoryData, priorityData, statusData = [], ticket] = await Promise.all(requests);

        if (ignore) {
          return;
        }

        setCategories(categoryData);
        setPriorities(priorityData);
        setStatuses(statusData);

        if (ticket) {
          setFormData({
            title: ticket.title,
            description: ticket.description,
            categoryId: String(ticket.categoryId),
            priorityId: String(ticket.priorityId),
            ticketStatusId: String(ticket.ticketStatusId),
          });
        }
      } catch (requestError) {
        if (!ignore) {
          setError(getApiErrorMessage(requestError, "The ticket form could not be loaded."));
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadForm();
    return () => {
      ignore = true;
    };
  }, [id, isEditing]);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setValidationErrors((current) => ({ ...current, [name]: "" }));
  }

  function validate() {
    const nextErrors = {};

    if (!formData.title.trim()) nextErrors.title = "Title is required.";
    if (!formData.description.trim()) nextErrors.description = "Description is required.";
    if (!formData.categoryId) nextErrors.categoryId = "Category is required.";
    if (!formData.priorityId) nextErrors.priorityId = "Priority is required.";
    if (isEditing && !formData.ticketStatusId) nextErrors.ticketStatusId = "Status is required.";

    setValidationErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    const request = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      categoryId: Number(formData.categoryId),
      priorityId: Number(formData.priorityId),
    };

    try {
      if (isEditing) {
        await updateTicket(id, {
          ...request,
          ticketStatusId: Number(formData.ticketStatusId),
        });
        navigate(`/tickets/${id}`, { replace: true, state: { message: "Ticket updated successfully." } });
      } else {
        await createTicket(request);
        navigate("/tickets", { replace: true });
      }
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, `The ticket could not be ${isEditing ? "updated" : "created"}.`));
    } finally {
      setIsSubmitting(false);
    }
  }

  const lookupsEmpty = !isLoading && (categories.length === 0 || priorities.length === 0 || (isEditing && statuses.length === 0));

  return (
    <AppLayout>
      <section className="dashboard-heading ticket-page-heading">
        <div>
          <p className="dashboard-welcome">{isEditing ? "Update support request" : "New support request"}</p>
          <h1>{isEditing ? "Edit Ticket" : "Create Ticket"}</h1>
          <p>{isEditing ? "Change the ticket details and current status." : "Tell the IT team what you need help with."}</p>
        </div>
        <Link className="dashboard-button dashboard-button-secondary" to={isEditing ? `/tickets/${id}` : "/tickets"}>
          <TicketIcon name="arrowLeft" />
          Cancel
        </Link>
      </section>

      {error && <div className="ticket-alert ticket-alert-error" role="alert">{error}</div>}

      {isLoading ? (
        <section className="card ticket-state ticket-form-loading" role="status">
          <span className="ticket-spinner" />
          <strong>Loading ticket form</strong>
        </section>
      ) : (
        <form className="card ticket-form-card" onSubmit={handleSubmit} noValidate>
          <div className="ticket-form-header">
            <h2>Ticket Information</h2>
            <p>Fields marked required must be completed before saving.</p>
          </div>

          {lookupsEmpty && (
            <div className="ticket-alert ticket-alert-warning" role="alert">
              One or more dropdowns have no available options. Add lookup data before submitting this form.
            </div>
          )}

          <div className="ticket-form-grid">
            <label className="ticket-field ticket-field-wide">
              <span>Title <b>*</b></span>
              <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Briefly describe the issue"
                aria-invalid={Boolean(validationErrors.title)}
              />
              {validationErrors.title && <small className="ticket-field-error">{validationErrors.title}</small>}
            </label>

            <label className="ticket-field ticket-field-wide">
              <span>Description <b>*</b></span>
              <textarea
                name="description"
                rows="7"
                value={formData.description}
                onChange={handleChange}
                placeholder="Include the symptoms, impact, and anything you already tried."
                aria-invalid={Boolean(validationErrors.description)}
              />
              {validationErrors.description && <small className="ticket-field-error">{validationErrors.description}</small>}
            </label>

            <label className="ticket-field">
              <span>Category <b>*</b></span>
              <select name="categoryId" value={formData.categoryId} onChange={handleChange} aria-invalid={Boolean(validationErrors.categoryId)}>
                <option value="">Select a category</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.categoryName}</option>)}
              </select>
              {validationErrors.categoryId && <small className="ticket-field-error">{validationErrors.categoryId}</small>}
            </label>

            <label className="ticket-field">
              <span>Priority <b>*</b></span>
              <select name="priorityId" value={formData.priorityId} onChange={handleChange} aria-invalid={Boolean(validationErrors.priorityId)}>
                <option value="">Select a priority</option>
                {priorities.map((priority) => <option key={priority.id} value={priority.id}>{priority.priorityName}</option>)}
              </select>
              {validationErrors.priorityId && <small className="ticket-field-error">{validationErrors.priorityId}</small>}
            </label>

            {isEditing && (
              <label className="ticket-field">
                <span>Status <b>*</b></span>
                <select name="ticketStatusId" value={formData.ticketStatusId} onChange={handleChange} aria-invalid={Boolean(validationErrors.ticketStatusId)}>
                  <option value="">Select a status</option>
                  {statuses.map((status) => <option key={status.id} value={status.id}>{status.statusName}</option>)}
                </select>
                {validationErrors.ticketStatusId && <small className="ticket-field-error">{validationErrors.ticketStatusId}</small>}
              </label>
            )}
          </div>

          <div className="ticket-form-actions">
            <Link className="dashboard-button dashboard-button-secondary" to={isEditing ? `/tickets/${id}` : "/tickets"}>Cancel</Link>
            <button className="dashboard-button dashboard-button-primary" type="submit" disabled={isSubmitting || lookupsEmpty}>
              {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Create Ticket"}
            </button>
          </div>
        </form>
      )}
    </AppLayout>
  );
}

export default TicketForm;
