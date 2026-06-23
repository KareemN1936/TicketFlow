import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import TicketIcon from "../components/TicketIcon";
import { useAuth } from "../auth/AuthContext";
import {
  createTicket,
  getCategories,
  getPriorities,
  getTicketById,
  getTicketStatuses,
  updateTicket,
} from "../services/ticketService";
import { getApiErrorMessage } from "../utils/apiError";
import {
  deleteTicketAttachment,
  downloadTicketAttachment,
  getTicketAttachments,
  uploadTicketAttachment,
} from "../services/attachmentService";
import {
  allowedAttachmentExtensions,
  formatFileSize,
  validateAttachment,
} from "../utils/attachmentValidation";

const initialForm = {
  title: "",
  description: "",
  categoryId: "",
  priorityId: "",
  ticketStatusId: "",
};

function getAttachmentErrorMessage(error, fallbackMessage) {
  if (error.response?.status === 401) return "Your session has expired. Please sign in again.";
  if (error.response?.status === 403) return "You do not have permission to manage attachments for this ticket.";
  if (error.response?.status === 404) return "The ticket or attachment could not be found.";
  return getApiErrorMessage(error, fallbackMessage);
}

function TicketForm() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const [formData, setFormData] = useState(initialForm);
  const [categories, setCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [ticket, setTicket] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStage, setSubmissionStage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [attachmentError, setAttachmentError] = useState("");
  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState(null);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState(null);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const attachmentInputRef = useRef(null);

  useEffect(() => {
    let ignore = false;

    async function loadForm() {
      try {
        const requests = [getCategories(), getPriorities()];
        if (isEditing) {
          const attachmentPromise = getTicketAttachments(id)
            .then((data) => ({ data, error: null }))
            .catch((requestError) => ({ data: [], error: requestError }));
          requests.push(getTicketStatuses(), getTicketById(id), attachmentPromise);
        }

        const [categoryData, priorityData, statusData = [], ticketData, attachmentResult] = await Promise.all(requests);

        if (ignore) {
          return;
        }

        setCategories(categoryData);
        setPriorities(priorityData);
        setStatuses(statusData);

        if (ticketData) {
          setTicket(ticketData);
          setFormData({
            title: ticketData.title,
            description: ticketData.description,
            categoryId: String(ticketData.categoryId),
            priorityId: String(ticketData.priorityId),
            ticketStatusId: String(ticketData.ticketStatusId),
          });

          setAttachments(attachmentResult?.data || []);
          if (attachmentResult?.error) {
            setAttachmentError(getAttachmentErrorMessage(attachmentResult.error, "Attachments could not be loaded."));
          }
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

  function handleAttachmentSelection(event) {
    const files = Array.from(event.target.files || []);
    const invalidFile = files.find((file) => validateAttachment(file));

    if (invalidFile) {
      setValidationErrors((current) => ({ ...current, attachments: validateAttachment(invalidFile) }));
      setSelectedFiles([]);
      if (attachmentInputRef.current) attachmentInputRef.current.value = "";
      return;
    }

    setSelectedFiles(files);
    setValidationErrors((current) => ({ ...current, attachments: "" }));
  }

  function removeSelectedFile(fileToRemove) {
    setSelectedFiles((files) => files.filter((file) => file !== fileToRemove));
    if (attachmentInputRef.current) attachmentInputRef.current.value = "";
  }

  async function handleAttachmentDownload(attachment) {
    setAttachmentError("");
    setDownloadingAttachmentId(attachment.id);

    try {
      const blob = await downloadTicketAttachment(id, attachment.id);
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = attachment.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (requestError) {
      setAttachmentError(getAttachmentErrorMessage(requestError, "The attachment could not be downloaded."));
    } finally {
      setDownloadingAttachmentId(null);
    }
  }

  async function handleAttachmentDelete(attachment) {
    if (!window.confirm(`Delete ${attachment.fileName}? This action cannot be undone.`)) return;

    setAttachmentError("");
    setDeletingAttachmentId(attachment.id);

    try {
      await deleteTicketAttachment(id, attachment.id);
      setAttachments((items) => items.filter((item) => item.id !== attachment.id));
    } catch (requestError) {
      setAttachmentError(getAttachmentErrorMessage(requestError, "The attachment could not be deleted."));
    } finally {
      setDeletingAttachmentId(null);
    }
  }

  const roles = user?.roles || [];
  const identityValues = [user?.fullName, user?.email].filter(Boolean).map((value) => value.trim().toLowerCase());
  const isCurrentUser = (value) => identityValues.includes(String(value || "").trim().toLowerCase());
  const isAssignedAgent = roles.includes("ITSupportAgent") && isCurrentUser(ticket?.assignedToUserName);
  const canDeleteAttachment = (attachment) => roles.some((role) => ["Admin", "Manager"].includes(role))
    || isAssignedAgent
    || isCurrentUser(attachment.uploadedBy);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    setSubmissionStage(isEditing ? "saving" : "creating");

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

        if (selectedFiles.length > 0) {
          setSubmissionStage("uploading");
          const uploadResults = await Promise.allSettled(
            selectedFiles.map((file) => uploadTicketAttachment(id, file)),
          );
          const failedUploads = uploadResults.filter((result) => result.status === "rejected").length;

          if (failedUploads > 0) {
            navigate(`/tickets/${id}`, {
              replace: true,
              state: { error: `Ticket updated, but ${failedUploads} ${failedUploads === 1 ? "attachment" : "attachments"} could not be uploaded.` },
            });
            return;
          }
        }

        navigate(`/tickets/${id}`, {
          replace: true,
          state: { message: selectedFiles.length ? "Ticket and attachments updated successfully." : "Ticket updated successfully." },
        });
      } else {
        const createdTicket = await createTicket(request);

        if (selectedFiles.length > 0) {
          setSubmissionStage("uploading");
          const uploadResults = await Promise.allSettled(
            selectedFiles.map((file) => uploadTicketAttachment(createdTicket.id, file)),
          );
          const failedUploads = uploadResults.filter((result) => result.status === "rejected").length;

          if (failedUploads > 0) {
            navigate(`/tickets/${createdTicket.id}`, {
              replace: true,
              state: {
                error: `Ticket created, but ${failedUploads} ${failedUploads === 1 ? "attachment" : "attachments"} could not be uploaded. You can retry in the Attachments section.`,
              },
            });
            return;
          }
        }

        navigate(`/tickets/${createdTicket.id}`, {
          replace: true,
          state: { message: selectedFiles.length ? "Ticket and attachments created successfully." : "Ticket created successfully." },
        });
      }
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, `The ticket could not be ${isEditing ? "updated" : "created"}.`));
    } finally {
      setIsSubmitting(false);
      setSubmissionStage("");
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

            {(
              <div className="ticket-field ticket-field-wide ticket-create-attachments">
                <span>Attachments <small>Optional</small></span>
                {isEditing && attachmentError && <div className="ticket-alert ticket-alert-error" role="alert">{attachmentError}</div>}

                {isEditing && attachments.length > 0 && (
                  <div className="ticket-create-attachment-list ticket-existing-attachment-list">
                    {attachments.map((attachment) => (
                      <article key={attachment.id}>
                        <span className="ticket-attachment-icon"><TicketIcon name="file" /></span>
                        <div><strong>{attachment.fileName}</strong><small>{formatFileSize(attachment.fileSize)} · Uploaded by {attachment.uploadedBy}</small></div>
                        <div className="ticket-attachment-actions">
                          <button className="ticket-action-button" type="button" disabled={downloadingAttachmentId === attachment.id} onClick={() => handleAttachmentDownload(attachment)}>
                            <TicketIcon name="download" />{downloadingAttachmentId === attachment.id ? "Downloading..." : "Download"}
                          </button>
                          {canDeleteAttachment(attachment) && (
                            <button className="ticket-action-button ticket-action-danger" type="button" disabled={deletingAttachmentId === attachment.id} onClick={() => handleAttachmentDelete(attachment)}>
                              <TicketIcon name="trash" />{deletingAttachmentId === attachment.id ? "Deleting..." : "Delete"}
                            </button>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                )}

                <label className="ticket-create-attachment-picker" htmlFor="ticket-create-attachment-input">
                  <TicketIcon name="attachment" />
                  <span>Choose files</span>
                  <input
                    ref={attachmentInputRef}
                    id="ticket-create-attachment-input"
                    type="file"
                    multiple
                    accept={allowedAttachmentExtensions.join(",")}
                    disabled={isSubmitting}
                    onChange={handleAttachmentSelection}
                  />
                </label>
                <small className="ticket-attachment-help">PNG, JPG, PDF, Word, TXT, or LOG. Maximum 10 MB per file.</small>
                {validationErrors.attachments && <small className="ticket-field-error">{validationErrors.attachments}</small>}

                {selectedFiles.length > 0 && (
                  <>
                  {isEditing && <span className="ticket-new-attachments-label">New files to upload when saved</span>}
                  <div className="ticket-create-attachment-list">
                    {selectedFiles.map((file) => (
                      <article key={`${file.name}-${file.size}-${file.lastModified}`}>
                        <span className="ticket-attachment-icon"><TicketIcon name="file" /></span>
                        <div><strong>{file.name}</strong><small>{formatFileSize(file.size)}</small></div>
                        <button className="ticket-action-button ticket-action-danger" type="button" disabled={isSubmitting} onClick={() => removeSelectedFile(file)} aria-label={`Remove ${file.name}`}>
                          <TicketIcon name="trash" />
                          Remove
                        </button>
                      </article>
                    ))}
                  </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="ticket-form-actions">
            <Link className="dashboard-button dashboard-button-secondary" to={isEditing ? `/tickets/${id}` : "/tickets"}>Cancel</Link>
            <button className="dashboard-button dashboard-button-primary" type="submit" disabled={isSubmitting || lookupsEmpty}>
              {submissionStage === "uploading"
                ? `Uploading ${selectedFiles.length} ${selectedFiles.length === 1 ? "file" : "files"}...`
                : isSubmitting
                  ? isEditing ? "Saving..." : "Creating ticket..."
                  : isEditing ? "Save Changes" : "Create Ticket"}
            </button>
          </div>
        </form>
      )}
    </AppLayout>
  );
}

export default TicketForm;
