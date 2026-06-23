import { useCallback, useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import TicketIcon from "../components/TicketIcon";
import { adminUserService } from "../services/adminUserService";
import { getApiErrorMessage } from "../utils/apiError";
import "../App.css";

const emptyForm = { fullName: "", email: "", password: "", role: "" };

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    setError("");
    try {
      const [userList, roleList] = await Promise.all([
        adminUserService.getUsers(),
        adminUserService.getRoles(),
      ]);
      setUsers(userList);
      setRoles(roleList);
      setForm((current) => ({ ...current, role: current.role || roleList[0] || "" }));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "User management could not be loaded."));
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadData(); }, [loadData]);

  async function createUser(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      await adminUserService.createUser(form);
      setForm({ ...emptyForm, role: roles[0] || "" });
      setSuccess("User created successfully.");
      setIsCreateOpen(false);
      await loadData();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "The user could not be created."));
    } finally {
      setSubmitting(false);
    }
  }

  async function changeRole(userId, role) {
    setUpdatingId(userId);
    setError("");
    setSuccess("");
    try {
      const updated = await adminUserService.updateRole(userId, role);
      setUsers((current) => current.map((user) => user.id === userId ? updated : user));
      setSuccess("Role updated. The user must sign in again to receive the new role.");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "The role could not be updated."));
    } finally {
      setUpdatingId("");
    }
  }

  async function deleteUser(user) {
    if (!window.confirm(`Delete ${user.fullName || user.email}? This action cannot be undone.`)) return;
    setDeletingId(user.id);
    setError("");
    setSuccess("");
    try {
      await adminUserService.deleteUser(user.id);
      setUsers((current) => current.filter((item) => item.id !== user.id));
      setSuccess("User deleted successfully.");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "The user could not be deleted."));
    } finally {
      setDeletingId("");
    }
  }

  function openCreateUser() {
    setForm({ ...emptyForm, role: roles[0] || "" });
    setError("");
    setSuccess("");
    setIsCreateOpen(true);
  }

  return (
    <AppLayout>
      <section className="dashboard-heading">
        <div><p className="dashboard-welcome">Administration</p><h1>User Management</h1><p>Create accounts and control access roles.</p></div>
        <button className="dashboard-button dashboard-button-primary" type="button" onClick={openCreateUser} disabled={!roles.length}><TicketIcon name="plus" />Create User</button>
      </section>

      {error && <div className="ticket-alert ticket-alert-error" role="alert">{error}</div>}
      {success && <div className="ticket-alert ticket-alert-success" role="status">{success}</div>}

      <section className="card admin-user-list-card admin-user-list-full">
        <div className="panel-header"><div><h2>Users</h2><span className="panel-subtitle">{users.length} account{users.length === 1 ? "" : "s"}</span></div></div>
        {loading ? <div className="ticket-state"><span className="ticket-spinner" /><p>Loading users…</p></div> : !users.length ? <div className="ticket-state"><strong>No users found</strong></div> : (
          <div className="admin-user-table-wrap"><table className="admin-user-table"><thead><tr><th>User</th><th>Email</th><th>Created</th><th>Role</th><th>Actions</th></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td><strong>{user.fullName || "Unnamed user"}</strong></td><td>{user.email}</td><td>{new Date(user.createdAt).toLocaleDateString()}</td><td><select aria-label={`Role for ${user.fullName || user.email}`} value={user.role} disabled={updatingId === user.id || deletingId === user.id} onChange={(event) => changeRole(user.id, event.target.value)}>{roles.map((role) => <option key={role}>{role}</option>)}</select></td><td><button className="ticket-action-button ticket-action-danger" type="button" disabled={deletingId === user.id} onClick={() => deleteUser(user)}><TicketIcon name="trash" />{deletingId === user.id ? "Deleting…" : "Delete"}</button></td></tr>)}</tbody></table></div>
        )}
      </section>

      {isCreateOpen && <div className="modal-backdrop admin-create-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !submitting) setIsCreateOpen(false); }}>
        <section className="card ticket-modal admin-create-modal" role="dialog" aria-modal="true" aria-labelledby="create-user-title">
          <div className="modal-header"><div><p className="dashboard-welcome">Administration</p><h2 id="create-user-title">Create User</h2><span className="panel-subtitle">Add an account and assign its access role.</span></div><button className="modal-close" type="button" aria-label="Close" disabled={submitting} onClick={() => setIsCreateOpen(false)}>×</button></div>
          <form className="admin-user-form" onSubmit={createUser}>
            <label className="ticket-field"><span>Full name</span><input autoFocus required value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} /></label>
            <label className="ticket-field"><span>Email</span><input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
            <label className="ticket-field"><span>Temporary password</span><input required minLength="6" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
            <label className="ticket-field"><span>Role</span><select required value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>{roles.map((role) => <option key={role}>{role}</option>)}</select></label>
            <div className="modal-actions"><button className="dashboard-button dashboard-button-secondary" type="button" disabled={submitting} onClick={() => setIsCreateOpen(false)}>Cancel</button><button className="dashboard-button dashboard-button-primary" disabled={submitting || !roles.length}>{submitting ? "Creating…" : "Create User"}</button></div>
          </form>
        </section>
      </div>}
    </AppLayout>
  );
}

export default AdminUsers;
