import { useAuth } from "../auth/AuthContext";

function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div style={{ maxWidth: "700px", margin: "80px auto", fontFamily: "Arial" }}>
      <h1>Dashboard</h1>

      <p>Welcome, {user?.fullName}</p>
      <p>Email: {user?.email}</p>
      <p>Role: {user?.roles?.join(", ")}</p>

      <button onClick={logout}>Logout</button>
    </div>
  );
}

export default Dashboard;